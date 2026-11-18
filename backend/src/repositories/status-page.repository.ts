// ============================================
// Repository: Status Page
// ============================================

import type { SupabaseInstance, StatusPage } from '../lib/types.js';

export interface CreateStatusPageData {
  owner_id: string;
  slug: string;
  title: string;
  description?: string | null;
  is_public?: boolean;
}

export interface UpdateStatusPageData {
  slug?: string;
  title?: string;
  description?: string | null;
  is_public?: boolean;
}

/**
 * Repository untuk operasi CRUD status page di Supabase.
 * Mengelola tabel public.status_pages sesuai PRD FR-9.
 */
export class StatusPageRepository {
  constructor(private readonly supabase: SupabaseInstance) {}

  /**
   * Mengambil seluruh status page milik owner tertentu.
   */
  async listByOwner(ownerId: string): Promise<StatusPage[]> {
    const { data, error } = await this.supabase
      .from('status_pages')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return (data as StatusPage[]) || [];
  }

  /**
   * Menghitung jumlah status page milik owner (untuk penegakan limit paket).
   */
  async countByOwner(ownerId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('status_pages')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId);

    if (error) {
      throw error;
    }
    return count || 0;
  }

  /**
   * Mengambil status page berdasarkan ID (dengan verifikasi owner_id jika disertakan).
   */
  async findById(id: string, ownerId?: string): Promise<StatusPage | null> {
    let query = this.supabase.from('status_pages').select('*').eq('id', id);
    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }
    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      return null;
    }
    return data as StatusPage;
  }

  /**
   * Mengambil status page berdasarkan slug (digunakan untuk halaman publik).
   */
  async findBySlug(slug: string): Promise<StatusPage | null> {
    const { data, error } = await this.supabase
      .from('status_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as StatusPage;
  }

  /**
   * Memeriksa apakah slug sudah digunakan oleh status page lain.
   */
  async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('status_pages')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return Boolean(data && data.length > 0);
  }

  /**
   * Membuat status page baru di database.
   */
  async create(data: CreateStatusPageData): Promise<StatusPage> {
    const { data: created, error } = await this.supabase
      .from('status_pages')
      .insert({
        owner_id: data.owner_id,
        slug: data.slug,
        title: data.title,
        description: data.description ?? null,
        is_public: data.is_public ?? true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return created as StatusPage;
  }

  /**
   * Memperbarui status page milik owner tertentu.
   */
  async update(id: string, ownerId: string, updates: UpdateStatusPageData): Promise<StatusPage | null> {
    const { data, error } = await this.supabase
      .from('status_pages')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }
    return data as StatusPage;
  }

  /**
   * Menghapus status page milik owner tertentu.
   */
  async delete(id: string, ownerId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('status_pages')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      throw error;
    }
    return (count || 0) > 0;
  }
}
