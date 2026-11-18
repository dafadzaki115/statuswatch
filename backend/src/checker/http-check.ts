// ============================================
// Checker: HTTP Check (sesuai PRD FR-3)
// ============================================

import type { HttpCheckResult } from '../lib/types.js';

/**
 * Melakukan pengecekan HTTP ke URL target.
 * Mengukur response time dan mencocokkan status code.
 * Implementasi akan ditambahkan pada tahap Checker.
 */
export async function performHttpCheck(
  _url: string,
  _method: string,
  _expectedStatus: number,
  _timeoutMs: number
): Promise<HttpCheckResult> {
  // TODO: Implementasi pada tahap fitur
  throw new Error('Not implemented');
}
