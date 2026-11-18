// ============================================
// Validator: Monitor (Zod)
// ============================================

import { z } from 'zod';
import type { PlanType } from '../lib/types.js';
import { getDefaultIntervalForPlan, assertIntervalAllowedForPlan } from '../lib/plans.js';

export const createMonitorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nama monitor wajib diisi' })
    .max(80, { message: 'Nama monitor maksimal 80 karakter' }),
  url: z
    .string()
    .trim()
    .max(2048, { message: 'URL maksimal 2048 karakter' })
    .refine((val) => /^https?:\/\//i.test(val), {
      message: 'URL harus dimulai dengan http:// atau https://',
    }),
  method: z.enum(['GET', 'HEAD'], {
    message: 'HTTP method harus GET atau HEAD',
  }).default('GET'),
  interval_minutes: z.coerce
    .number()
    .refine((v) => [5, 10, 30, 60].includes(v), {
      message: 'Interval harus 5, 10, 30, atau 60 menit',
    })
    .optional(),
  expected_status: z.coerce
    .number()
    .int()
    .min(100, { message: 'Status code minimal 100' })
    .max(599, { message: 'Status code maksimal 599' })
    .default(200),
  timeout_ms: z.coerce
    .number()
    .int()
    .min(1000, { message: 'Timeout minimal 1000 ms' })
    .max(8000, { message: 'Timeout maksimal 8000 ms' })
    .default(5000),
  status_page_id: z.string().uuid({ message: 'Status page ID harus berupa UUID valid' }).nullable().optional(),
  is_active: z.boolean().default(true),
});

export const updateMonitorSchema = createMonitorSchema.partial();

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;

/**
 * Menormalkan dan memvalidasi interval monitor berdasarkan paket pengguna (Free/Pro).
 * Memastikan pengguna Free tidak melewati batas minimum 10 menit karena default database SQL (5 menit).
 */
export function resolveMonitorInterval(
  requestedInterval: number | undefined,
  plan: PlanType
): number {
  if (requestedInterval === undefined) {
    return getDefaultIntervalForPlan(plan);
  }
  assertIntervalAllowedForPlan(requestedInterval, plan);
  return requestedInterval;
}
