// ============================================
// Definisi tipe dasar untuk StatusWatch
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';

/** Tipe Supabase Client yang diterima oleh semua repository/service */
export type SupabaseInstance = SupabaseClient;

/** Status monitor */
export type MonitorStatus = 'up' | 'down' | 'unknown';

/** HTTP method yang didukung */
export type HttpMethod = 'GET' | 'HEAD';

/** Paket langganan */
export type PlanType = 'free' | 'pro';

/** Status insiden */
export type IncidentStatus = 'open' | 'resolved';

/** Tipe untuk respons error standar */
export interface ApiError {
  code: string;
  message: string;
}

/** Respons error yang dibungkus */
export interface ApiErrorResponse {
  error: ApiError;
}

/** Kode error standar */
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  PLAN_LIMIT_REACHED: 'PLAN_LIMIT_REACHED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SSRF_BLOCKED: 'SSRF_BLOCKED',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Hasil pengecekan HTTP */
export interface HttpCheckResult {
  statusCode: number | null;
  responseMs: number;
  isUp: boolean;
  error: string | null;
}

/** Hasil pengecekan SSL */
export interface SslCheckResult {
  expiresAt: Date | null;
  daysRemaining: number | null;
  error: string | null;
}

/** Hasil gabungan pengecekan */
export interface CheckResult {
  http: HttpCheckResult;
  ssl: SslCheckResult | null;
}

/** Ringkasan hasil cron */
export interface CronRunSummary {
  checked: number;
  up: number;
  down: number;
  incidents_opened: number;
  incidents_resolved: number;
  duration_ms: number;
}
