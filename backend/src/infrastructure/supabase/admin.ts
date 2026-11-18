import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Pastikan kode ini tidak pernah dieksekusi di lingkungan browser
if (typeof window !== 'undefined') {
  throw new Error('FATAL: Supabase admin client hanya boleh digunakan di lingkungan server!');
}

/**
 * Validasi dan ambil environment variable untuk Supabase Admin.
 */
function getAdminConfig() {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL: Supabase admin client hanya boleh digunakan di lingkungan server!');
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Konfigurasi URL Supabase tidak ditemukan. Pastikan SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_URL telah diset.'
    );
  }

  if (!/^https?:\/\//i.test(supabaseUrl)) {
    throw new Error(
      'URL Supabase tidak valid. URL harus dimulai dengan http:// atau https:// (contoh: https://<project-ref>.supabase.co).'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Konfigurasi SUPABASE_SERVICE_ROLE_KEY tidak ditemukan. Kunci ini wajib untuk client admin server.'
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

/**
 * Membuat instance client Supabase baru dengan hak akses Service Role (Admin).
 * Nonaktifkan autoRefreshToken dan persistSession karena berjalan di server.
 */
export function createAdminClient(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getAdminConfig();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Mendapatkan singleton instance client Supabase Admin.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!cachedAdminClient) {
    cachedAdminClient = createAdminClient();
  }
  return cachedAdminClient;
}

export const getAdminClient = getSupabaseAdmin;

/**
 * Proxy object agar dapat langsung memanggil properti client seperti:
 * supabaseAdmin.from('monitors')...
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
