// ============================================
// Checker: HTTP Check (sesuai PRD FR-3 & Bagian 12)
// ============================================

import type { HttpCheckResult } from '../lib/types.js';
import { validateUrlNotSSRFAsync, validateRedirectUrl } from '../security/ssrf-guard.js';

const MAX_REDIRECTS = 5;
const USER_AGENT = 'StatusWatch/1.0 (Cloud Uptime Monitor)';

/**
 * Melakukan pengecekan HTTP ke URL target:
 * - Menjalankan validasi SSRF (termasuk DNS) sebelum request.
 * - Memeriksa ulang SSRF pada setiap redirect (maksimal 5 redirect).
 * - Mengukur response time (ms) hingga header diterima.
 * - Mencocokkan status code dengan expectedStatus.
 * - Menyimpan kode error yang ringkas dan aman tanpa stack trace.
 */
export async function performHttpCheck(
  targetUrl: string,
  method: string = 'GET',
  expectedStatus: number = 200,
  timeoutMs: number = 5000
): Promise<HttpCheckResult> {
  const startTime = Date.now();
  let currentUrl = targetUrl;
  let redirectsCount = 0;

  try {
    // 1. Validasi SSRF awal sebelum membuat koneksi
    await validateUrlNotSSRFAsync(currentUrl);

    // Loop penanganan redirect manual untuk memverifikasi keamanan SSRF tiap hop
    while (redirectsCount <= MAX_REDIRECTS) {
      const response = await fetch(currentUrl, {
        method,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: '*/*',
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      });

      // Jika respons adalah redirect (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          // Redirect tanpa header location
          const responseMs = Date.now() - startTime;
          return {
            statusCode: response.status,
            responseMs,
            isUp: response.status === expectedStatus,
            error: response.status === expectedStatus ? null : `UNEXPECTED_STATUS:${response.status}`,
          };
        }

        redirectsCount++;
        if (redirectsCount > MAX_REDIRECTS) {
          const responseMs = Date.now() - startTime;
          return {
            statusCode: response.status,
            responseMs,
            isUp: false,
            error: 'TOO_MANY_REDIRECTS',
          };
        }

        // Verifikasi URL redirect terhadap SSRF sebelum melanjutkan
        currentUrl = await validateRedirectUrl(currentUrl, location);
        continue;
      }

      // Respons final (bukan redirect)
      const responseMs = Date.now() - startTime;
      const isUp = response.status === expectedStatus;

      // Batalkan konsumsi body agar efisien
      try {
        if (response.body) {
          await response.body.cancel();
        }
      } catch {
        // Abaikan error saat membatalkan body
      }

      return {
        statusCode: response.status,
        responseMs,
        isUp,
        error: isUp ? null : `UNEXPECTED_STATUS:${response.status}`,
      };
    }

    return {
      statusCode: null,
      responseMs: Date.now() - startTime,
      isUp: false,
      error: 'TOO_MANY_REDIRECTS',
    };
  } catch (error: unknown) {
    const responseMs = Date.now() - startTime;
    let safeError = 'CONNECTION_ERROR';

    const err = error as { name?: string; code?: string; message?: string };

    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      safeError = 'TIMEOUT';
    } else if (err.code === 'SSRF_BLOCKED' || (err.message && err.message.includes('SSRF'))) {
      safeError = 'SSRF_BLOCKED';
    } else if (err.code === 'ENOTFOUND' || err.message?.includes('ENOTFOUND')) {
      safeError = 'DNS_FAILURE';
    } else if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      safeError = 'CONNECTION_REFUSED';
    } else if (
      err.code?.includes('CERT') ||
      err.code?.includes('TLS') ||
      err.message?.includes('certificate') ||
      err.message?.includes('SSL')
    ) {
      safeError = 'TLS_ERROR';
    }

    return {
      statusCode: null,
      responseMs,
      isUp: false,
      error: safeError,
    };
  }
}
