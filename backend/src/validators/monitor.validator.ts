// ============================================
// Validator: Monitor (Zod)
// ============================================

import { z } from 'zod';

export const createMonitorSchema = z.object({
  name: z.string().min(1).max(80),
  url: z
    .string()
    .max(2048)
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URL harus dimulai dengan http:// atau https://',
    }),
  method: z.enum(['GET', 'HEAD']).default('GET'),
  interval_minutes: z.coerce.number().refine((v) => [5, 10, 30, 60].includes(v), {
    message: 'Interval harus 5, 10, 30, atau 60 menit',
  }).default(5),
  expected_status: z.coerce.number().int().min(100).max(599).default(200),
  timeout_ms: z.coerce.number().int().min(1000).max(8000).default(5000),
  status_page_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const updateMonitorSchema = createMonitorSchema.partial();

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
