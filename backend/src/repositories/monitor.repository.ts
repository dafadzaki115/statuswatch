// ============================================
// Repository: Monitor
// ============================================

import type { SupabaseInstance, Monitor } from '../lib/types.js';

export interface CreateMonitorData {
  owner_id: string;
  name: string;
  url: string;
  method?: 'GET' | 'HEAD';
  interval_minutes?: number;
  expected_status?: number;
  timeout_ms?: number;
  status_page_id?: string | null;
  is_active?: boolean;
}

export interface UpdateMonitorData {
  name?: string;
  url?: string;
  method?: 'GET' | 'HEAD';
  interval_minutes?: number;
  expected_status?: number;
  timeout_ms?: number;
  status_page_id?: string | null;
  is_active?: boolean;
  current_status?: 'up' | 'down' | 'unknown';
  consecutive_failures?: number;
  last_checked_at?: string | null;
  last_status_code?: number | null;
  last_response_ms?: number | null;
  ssl_expires_at?: string | null;
}

export class MonitorRepository {
  constructor(private readonly supabase: SupabaseInstance) {}

  /**
   * Mengambil semua monitor milik owner tertentu, diurutkan berdasarkan tanggal buat terbaru.
   */
  async listByOwner(ownerId: string): Promise<Monitor[]> {
    const { data, error } = await this.supabase
      .from('monitors')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return (data as Monitor[]) || [];
  }

  /**
   * Menghitung total monitor milik owner tertentu.
   */
  async countByOwner(ownerId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('monitors')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId);

    if (error) {
      throw error;
    }
    return count || 0;
  }

  /**
   * Mengambil monitor berdasarkan ID (opsional dengan verifikasi ownerId untuk isolasi).
   */
  async findById(id: string, ownerId?: string): Promise<Monitor | null> {
    let query = this.supabase.from('monitors').select('*').eq('id', id);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query.single();
    if (error || !data) {
      return null;
    }
    return data as Monitor;
  }

  /**
   * Menambahkan monitor baru ke database.
   */
  async create(data: CreateMonitorData): Promise<Monitor> {
    const { data: created, error } = await this.supabase
      .from('monitors')
      .insert({
        owner_id: data.owner_id,
        name: data.name,
        url: data.url,
        method: data.method ?? 'GET',
        interval_minutes: data.interval_minutes ?? 5,
        expected_status: data.expected_status ?? 200,
        timeout_ms: data.timeout_ms ?? 5000,
        status_page_id: data.status_page_id ?? null,
        is_active: data.is_active ?? true,
        current_status: 'unknown',
        consecutive_failures: 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return created as Monitor;
  }

  /**
   * Memperbarui monitor milik owner tertentu.
   */
  async update(id: string, ownerId: string, updates: UpdateMonitorData): Promise<Monitor | null> {
    const { data, error } = await this.supabase
      .from('monitors')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }
    return data as Monitor;
  }

  /**
   * Menghapus monitor milik owner tertentu.
   */
  async delete(id: string, ownerId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('monitors')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      throw error;
    }
    return (count || 0) > 0;
  }

  /**
   * Mengambil monitor aktif yang sudah jatuh tempo untuk diperiksa (dipanggil oleh cron).
   * Jatuh tempo jika:
   * - last_checked_at IS NULL, ATAU
   * - now() >= last_checked_at + (interval_minutes * interval '1 minute')
   */
  async getDueMonitors(limit: number = 100): Promise<Monitor[]> {
    // Karena Supabase query builder tidak mudah membandingkan kolom kalkulasi interval langsung,
    // kita gunakan query dengan ordering last_checked_at nulls first dan filter di service/SQL RPC.
    const { data, error } = await this.supabase
      .from('monitors')
      .select('*')
      .eq('is_active', true)
      .order('last_checked_at', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    const now = Date.now();
    const monitors = (data as Monitor[]) || [];

    // Filter yang benar-benar jatuh tempo dengan toleransi 30 detik (PRD FR-5)
    const toleranceMs = 30 * 1000;
    return monitors.filter((m) => {
      if (!m.last_checked_at) return true;
      const last = new Date(m.last_checked_at).getTime();
      const intervalMs = (m.interval_minutes || 5) * 60 * 1000;
      return now >= last + intervalMs - toleranceMs;
    });
  }

  /**
   * Memperbarui status pengecekan monitor (digunakan oleh checker / cron).
   */
  async updateStatus(
    id: string,
    updates: {
      current_status: 'up' | 'down' | 'unknown';
      consecutive_failures: number;
      last_checked_at: string;
      last_status_code: number | null;
      last_response_ms: number;
      ssl_expires_at: string | null;
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('monitors')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
