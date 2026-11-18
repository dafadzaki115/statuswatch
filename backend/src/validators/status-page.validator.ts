// ============================================
// Validator: Status Page (Zod)
// ============================================

import { z } from 'zod';

export const createStatusPageSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$/, {
      message: 'Slug harus 3-40 karakter, huruf kecil, angka, dan strip (tidak boleh diawali/diakhiri strip)',
    }),
  title: z
    .string()
    .trim()
    .min(1, { message: 'Judul status page wajib diisi' })
    .max(80, { message: 'Judul status page maksimal 80 karakter' }),
  description: z
    .string()
    .trim()
    .max(300, { message: 'Deskripsi maksimal 300 karakter' })
    .nullable()
    .optional(),
  is_public: z.boolean().default(true),
});

export const updateStatusPageSchema = createStatusPageSchema.partial();

export type CreateStatusPageInput = z.infer<typeof createStatusPageSchema>;
export type UpdateStatusPageInput = z.infer<typeof updateStatusPageSchema>;
