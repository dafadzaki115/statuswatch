import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase untuk browser / Client Components.
 * Menggunakan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables tidak lengkap. Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY telah dikonfigurasi.'
    );
  }

  if (!/^https?:\/\//i.test(supabaseUrl)) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL tidak valid. URL harus dimulai dengan http:// atau https:// (contoh: https://<project-ref>.supabase.co).'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const createBrowserSupabaseClient = createClient;
