// ============================================
// Validator: Auth (Zod)
// ============================================

import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: 'Email wajib diisi' })
    .email({ message: 'Format email tidak valid' }),
  password: z
    .string()
    .min(8, { message: 'Password minimal 8 karakter' })
    .max(100, { message: 'Password maksimal 100 karakter' }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: 'Email wajib diisi' })
    .email({ message: 'Format email tidak valid' }),
  password: z
    .string()
    .min(1, { message: 'Password wajib diisi' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
