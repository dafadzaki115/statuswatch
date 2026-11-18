// ============================================
// Checker: SSL Check (sesuai PRD FR-4)
// ============================================

import type { SslCheckResult } from '../lib/types.js';

/**
 * Melakukan pengecekan sertifikat SSL/TLS menggunakan tls.connect.
 * Hanya untuk URL https://.
 * Implementasi akan ditambahkan pada tahap Checker.
 */
export async function performSslCheck(
  _hostname: string,
  _timeoutMs: number
): Promise<SslCheckResult> {
  // TODO: Implementasi pada tahap fitur
  throw new Error('Not implemented');
}
