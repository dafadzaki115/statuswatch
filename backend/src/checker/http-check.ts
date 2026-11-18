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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(currentUrl, {
          method,
          headers: {
            'User-Agent': USER_AGENT,
            Accept: '*/*',
          },
          redirect: 'manual',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

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
  } catch (error: any) {
    const responseMs = Date.now() - startTime;
    let safeError = 'CONNECTION_ERROR';

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      safeError = 'TIMEOUT';
    } else if (error.code === 'SSRF_BLOCKED' || (error.message && error.message.includes('SSRF'))) {
      safeError = 'SSRF_BLOCKED';
    } else if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
      safeError = 'DNS_FAILURE';
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      safeError = 'CONNECTION_REFUSED';
    } else if (
      error.code?.includes('CERT') ||
      error.code?.includes('TLS') ||
      error.message?.includes('certificate') ||
      error.message?.includes('SSL')
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
