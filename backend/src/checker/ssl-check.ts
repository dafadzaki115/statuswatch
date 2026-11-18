// ============================================
// Checker: SSL Check (sesuai PRD FR-4)
// ============================================

import * as tls from 'node:tls';
import type { SslCheckResult } from '../lib/types.js';

/**
 * Melakukan pengecekan sertifikat SSL/TLS menggunakan tls.connect.
 * Mengambil peer certificate, menghitung sisa hari berlaku (ssl_days_remaining),
 * dan tanggal kedaluwarsa (ssl_expires_at).
 *
 * Sesuai PRD FR-4:
 * - Hanya untuk URL https://
 * - Menggunakan tls.connect({ host, port: 443, servername: host, timeout })
 * - Mengambil socket.getPeerCertificate()
 */
export async function performSslCheck(
  hostname: string,
  timeoutMs: number = 5000
): Promise<SslCheckResult> {
  let host = hostname.trim();
  if (host.startsWith('https://') || host.startsWith('http://')) {
    try {
      const parsed = new URL(host);
      host = parsed.hostname;
    } catch {
      // Biarkan host asli jika parsing gagal
    }
  }

  let port = 443;
  if (host.includes(':')) {
    const parts = host.split(':');
    host = parts[0] || host;
    const parsedPort = Number.parseInt(parts[1] || '443', 10);
    if (!Number.isNaN(parsedPort) && parsedPort > 0) {
      port = parsedPort;
    }
  }

  return new Promise<SslCheckResult>((resolve) => {
    let settled = false;
    const safeResolve = (res: SslCheckResult) => {
      if (!settled) {
        settled = true;
        resolve(res);
      }
    };

    let socket: tls.TLSSocket | null = null;

    try {
      socket = tls.connect(
        {
          host,
          port,
          servername: host,
          rejectUnauthorized: false,
          timeout: timeoutMs,
        },
        () => {
          try {
            if (!socket) {
              return safeResolve({
                expiresAt: null,
                daysRemaining: null,
                error: 'SOCKET_CLOSED',
              });
            }

            const cert = socket.getPeerCertificate();
            if (!cert || !cert.valid_to) {
              socket.destroy();
              return safeResolve({
                expiresAt: null,
                daysRemaining: null,
                error: 'NO_PEER_CERTIFICATE',
              });
            }

            const expiresAt = new Date(cert.valid_to);
            const now = Date.now();
            const msRemaining = expiresAt.getTime() - now;
            const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));

            let error: string | null = null;
            if (socket.authorizationError && !socket.authorized) {
              // Jika sertifikat expired atau unauthorized, catat pesan tapi tetap sertakan tanggal
              error = socket.authorizationError.message || String(socket.authorizationError);
            }

            socket.destroy();
            return safeResolve({
              expiresAt,
              daysRemaining,
              error,
            });
          } catch (err: unknown) {
            socket?.destroy();
            return safeResolve({
              expiresAt: null,
              daysRemaining: null,
              error: err instanceof Error ? err.message : 'TLS_CERT_READ_ERROR',
            });
          }
        }
      );
    } catch (err: unknown) {
      return safeResolve({
        expiresAt: null,
        daysRemaining: null,
        error: err instanceof Error ? err.message : 'TLS_CONNECT_ERROR',
      });
    }

    socket.on('timeout', () => {
      socket?.destroy();
      safeResolve({
        expiresAt: null,
        daysRemaining: null,
        error: 'TIMEOUT',
      });
    });

    socket.on('error', (err: Error) => {
      socket?.destroy();
      safeResolve({
        expiresAt: null,
        daysRemaining: null,
        error: err.message || 'TLS_ERROR',
      });
    });
  });
}
