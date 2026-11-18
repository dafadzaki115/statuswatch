'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { registerSchema, loginSchema } from '@statuswatch/backend';

export interface AuthActionResult {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * Mendaftarkan akun baru menggunakan Supabase Auth.
 * Profil otomatis dibuat via PostgreSQL trigger (handle_new_user).
 */
export async function registerAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email')?.toString() || '';
  const password = formData.get('password')?.toString() || '';

  // Validasi input dengan Zod
  const validation = registerSchema.safeParse({ email, password });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Input tidak valid',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    let friendlyMessage = error.message;
    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('user already exists')
    ) {
      friendlyMessage = 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
    } else if (error.message.toLowerCase().includes('weak_password')) {
      friendlyMessage = 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.';
    }
    return {
      success: false,
      error: friendlyMessage,
    };
  }

  // Jika sesi langsung aktif (Confirm email dimatikan di Supabase)
  if (data.session) {
    redirect('/dashboard');
  }

  // Jika konfirmasi email aktif di Supabase
  return {
    success: true,
    message: 'Pendaftaran berhasil! Jika konfirmasi email diaktifkan, silakan periksa inbox Anda sebelum masuk.',
  };
}

/**
 * Masuk ke akun menggunakan email & password dengan Supabase SSR.
 */
export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email')?.toString() || '';
  const password = formData.get('password')?.toString() || '';

  // Validasi input dengan Zod
  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Input tidak valid',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    let friendlyMessage = error.message;
    if (
      error.message.toLowerCase().includes('invalid login credentials') ||
      error.message.toLowerCase().includes('invalid_grant')
    ) {
      friendlyMessage = 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.';
    } else if (error.message.toLowerCase().includes('email not confirmed')) {
      friendlyMessage = 'Email belum dikonfirmasi. Silakan periksa kotak masuk email Anda.';
    }
    return {
      success: false,
      error: friendlyMessage,
    };
  }

  redirect('/dashboard');
}

/**
 * Logout pengguna dan bersihkan sesi auth cookie.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
