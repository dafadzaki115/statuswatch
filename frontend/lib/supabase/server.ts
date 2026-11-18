import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase untuk lingkungan Server (Server Components, Server Actions, Route Handlers).
 * Menyesuaikan dengan Next.js 15 di mana cookies() bersifat asynchronous.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

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

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Dipanggil dari Server Component; mutasi cookie diabaikan
          // jika sesi diperbarui oleh middleware.
        }
      },
    },
  });
}

export const createServerSupabaseClient = createClient;
