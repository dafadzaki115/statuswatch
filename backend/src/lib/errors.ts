// ============================================
// Utility error class untuk StatusWatch
// ============================================

import type { ErrorCodeType, ApiErrorResponse } from './types.js';

/**
 * Custom error yang membawa HTTP status code dan kode error standar.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodeType;

  constructor(statusCode: number, code: ErrorCodeType, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }

  /**
   * Mengubah error menjadi respons JSON standar.
   */
  toJSON(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}
