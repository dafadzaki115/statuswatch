// ============================================
// Security: Proteksi SSRF (sesuai PRD Bagian 12)
// ============================================

import { AppError } from '../lib/errors.js';
import { ErrorCode } from '../lib/types.js';

/**
 * Memvalidasi bahwa URL aman dari SSRF.
 * Memeriksa skema, hostname, dan port.
 *
 * Implementasi penuh (termasuk DNS resolve) akan ditambahkan
 * pada tahap implementasi fitur.
 */
export function validateUrlNotSSRF(urlString: string): void {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new AppError(400, ErrorCode.SSRF_BLOCKED, 'URL tidak valid');
  }

  // Hanya http dan https yang diizinkan
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new AppError(400, ErrorCode.SSRF_BLOCKED, 'Hanya protokol http dan https yang diizinkan');
  }

  // Tolak hostname localhost
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    throw new AppError(400, ErrorCode.SSRF_BLOCKED, 'URL ke localhost tidak diizinkan');
  }

  // Tolak port selain 80/443
  if (parsed.port && !['80', '443', ''].includes(parsed.port)) {
    throw new AppError(400, ErrorCode.SSRF_BLOCKED, 'Hanya port 80 dan 443 yang diizinkan');
  }

  // TODO: Tambahkan DNS resolve + validasi IP privat pada tahap implementasi
}
