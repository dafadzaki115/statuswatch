// ============================================
// Validator: Plan (Zod)
// ============================================

import { z } from 'zod';

export const updatePlanSchema = z.object({
  plan: z.enum(['free', 'pro']),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
