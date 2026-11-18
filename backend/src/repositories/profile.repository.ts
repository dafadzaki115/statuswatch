// ============================================
// Repository: Profile
// ============================================

import type { SupabaseInstance, Profile, PlanType } from '../lib/types.js';

/**
 * Repository untuk operasi data profil/pengguna di Supabase.
 * Mengelola tabel public.profiles sesuai PRD Bagian 7.
 */
export class ProfileRepository {
  constructor(private readonly supabase: SupabaseInstance) {}

  /**
   * Mengambil profil pengguna berdasarkan UUID.
   */
  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as Profile;
  }

  /**
   * Memperbarui paket pengguna (Free atau Pro).
   * Catatan: Dilakukan melalui server endpoint dengan validasi batas kuota.
   */
  async updatePlan(id: string, plan: PlanType): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ plan })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Gagal memperbarui paket profil');
    }
    return data as Profile;
  }
}
