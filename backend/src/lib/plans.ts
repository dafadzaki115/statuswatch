// ============================================
// Definisi paket & limit (sesuai PRD Bagian 8)
// ============================================

import type { PlanType } from './types.js';

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
  return PLAN_LIMITS[plan];
}
