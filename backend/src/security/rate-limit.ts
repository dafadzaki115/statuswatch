// ============================================
// Security: Rate Limiter sederhana (in-memory)
// ============================================

import { AppError } from '../lib/errors.js';
import { ErrorCode } from '../lib/types.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Rate limiter sederhana berbasis in-memory.
 * Cocok untuk MVP (single-instance serverless).
 *
 * @param key   - Identifier unik (misalnya userId + endpoint)
 * @param limit - Maksimal permintaan per jendela waktu
 * @param windowMs - Jendela waktu dalam milidetik
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (entry.count >= limit) {
    throw new AppError(429, ErrorCode.RATE_LIMITED, 'Terlalu banyak permintaan, coba lagi nanti');
  }

  entry.count++;
}
