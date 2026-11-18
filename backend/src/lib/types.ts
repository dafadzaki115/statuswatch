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

/** Model database: Profile */
export interface Profile {
  id: string;
  email: string;
  plan: PlanType;
  created_at: string;
}

/** Model database: Monitor */
export interface Monitor {
  id: string;
  owner_id: string;
  status_page_id: string | null;
  name: string;
  url: string;
  method: HttpMethod;
  interval_minutes: number;
  expected_status: number;
  timeout_ms: number;
  is_active: boolean;
  current_status: MonitorStatus;
  consecutive_failures: number;
  last_checked_at: string | null;
  last_status_code: number | null;
  last_response_ms: number | null;
  ssl_expires_at: string | null;
  created_at: string;
}

/** Model database: Check */
export interface Check {
  id: number;
  monitor_id: string;
  checked_at: string;
  status_code: number | null;
  response_ms: number;
  is_up: boolean;
  error: string | null;
  ssl_days_remaining: number | null;
}

/** Model database: Incident */
export interface Incident {
  id: string;
  monitor_id: string;
  title: string;
  status: IncidentStatus;
  started_at: string;
  resolved_at: string | null;
  last_error: string | null;
}

/** Model database: StatusPage */
export interface StatusPage {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

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
