// ============================================
// Validator: Status Page (Zod)
// ============================================

import { z } from 'zod';

export const createStatusPageSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$/, {
      message: 'Slug harus 3-40 karakter, huruf kecil, angka, dan strip',
    }),
  title: z.string().min(1).max(80),
  description: z.string().max(300).nullable().optional(),
  is_public: z.boolean().default(true),
});

export const updateStatusPageSchema = createStatusPageSchema.partial();

export type CreateStatusPageInput = z.infer<typeof createStatusPageSchema>;
export type UpdateStatusPageInput = z.infer<typeof updateStatusPageSchema>;
