// ============================================
// Definisi paket & limit (sesuai PRD Bagian 8)
// ============================================

import type { PlanType } from './types.js';
import { AppError } from './errors.js';
import { ErrorCode } from './types.js';

export interface PlanLimits {
  maxMonitors: number;
  minIntervalMinutes: number;
  maxStatusPages: number;
  retentionDays: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxMonitors: 3,
    minIntervalMinutes: 10,
    maxStatusPages: 1,
    retentionDays: 7,
  },
  pro: {
    maxMonitors: 20,
    minIntervalMinutes: 5,
    maxStatusPages: 5,
    retentionDays: 30,
  },
};

/**
 * Mendapatkan limit berdasarkan tipe paket.
 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Mendapatkan interval default berdasarkan paket.
 * Menghindari lolosnya interval 5 menit untuk pengguna Free karena default database SQL adalah 5 menit.
 */
export function getDefaultIntervalForPlan(plan: PlanType): number {
  return plan === 'free' ? 10 : 5;
}

/**
 * Memeriksa apakah suatu interval diizinkan untuk paket tertentu.
 */
export function isIntervalAllowedForPlan(intervalMinutes: number, plan: PlanType): boolean {
  const limits = getPlanLimits(plan);
  const allowedIntervals = [5, 10, 30, 60];
  return allowedIntervals.includes(intervalMinutes) && intervalMinutes >= limits.minIntervalMinutes;
}

/**
 * Memvalidasi interval monitor untuk paket dan melempar AppError:
 * 1. Kesalahan format atau input tidak valid -> HTTP 400 (VALIDATION_ERROR).
 * 2. Pelanggaran batas paket (misal Free mencoba interval 5 menit) -> HTTP 403 (PLAN_LIMIT_REACHED).
 */
export function assertIntervalAllowedForPlan(intervalMinutes: number, plan: PlanType): void {
  const allowedIntervals = [5, 10, 30, 60];

  // 1. Kesalahan format atau input tidak valid -> HTTP 400
  if (!allowedIntervals.includes(intervalMinutes)) {
    throw new AppError(
      400,
      ErrorCode.VALIDATION_ERROR,
      `Interval pemeriksaan tidak valid (${intervalMinutes} menit). Pilihan yang tersedia: 5, 10, 30, atau 60 menit.`
    );
  }

  // 2. Pelanggaran batas paket -> HTTP 403 (PLAN_LIMIT_REACHED)
  const limits = getPlanLimits(plan);
  if (intervalMinutes < limits.minIntervalMinutes) {
    throw new AppError(
      403,
      ErrorCode.PLAN_LIMIT_REACHED,
      `Paket ${plan.toUpperCase()} memiliki batas interval minimum ${limits.minIntervalMinutes} menit. Interval ${intervalMinutes} menit memerlukan upgrade ke paket Pro.`
    );
  }
}

/**
 * Memeriksa apakah pengguna masih dapat menambahkan monitor baru sesuai kuota paketnya.
 */
export function assertCanCreateMonitor(currentCount: number, plan: PlanType): void {
  const limits = getPlanLimits(plan);
  if (currentCount >= limits.maxMonitors) {
    throw new AppError(
      403,
      ErrorCode.PLAN_LIMIT_REACHED,
      `Batas kuota monitor untuk paket ${plan.toUpperCase()} telah tercapai (maksimal ${limits.maxMonitors} monitor). Silakan tingkatkan ke paket Pro.`
    );
  }
}

/**
 * Memeriksa apakah pengguna masih dapat menambahkan status page baru sesuai kuota paketnya.
 */
export function assertCanCreateStatusPage(currentCount: number, plan: PlanType): void {
  const limits = getPlanLimits(plan);
  if (currentCount >= limits.maxStatusPages) {
    throw new AppError(
      403,
      ErrorCode.PLAN_LIMIT_REACHED,
      `Batas kuota Status Page untuk paket ${plan.toUpperCase()} telah tercapai (maksimal ${limits.maxStatusPages} halaman). Silakan tingkatkan ke paket Pro.`
    );
  }
}
