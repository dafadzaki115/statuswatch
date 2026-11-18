// ============================================
// Security: Autentikasi Cron (sesuai PRD Bagian 12)
// ============================================

import { AppError } from '../lib/errors.js';
import { ErrorCode } from '../lib/types.js';
import { timingSafeEqual } from 'node:crypto';

/**
 * Memverifikasi Bearer token cron menggunakan constant-time comparison.
 */
export function verifyCronSecret(authorizationHeader: string | null, expectedSecret: string): void {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new AppError(401, ErrorCode.UNAUTHORIZED, 'Token otorisasi tidak ada');
  }

  const token = authorizationHeader.slice(7);

  if (token.length === 0 || expectedSecret.length === 0) {
    throw new AppError(401, ErrorCode.UNAUTHORIZED, 'Token tidak valid');
  }

  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(expectedSecret);

  if (tokenBuffer.length !== secretBuffer.length || !timingSafeEqual(tokenBuffer, secretBuffer)) {
    throw new AppError(401, ErrorCode.UNAUTHORIZED, 'Token tidak valid');
  }
}
