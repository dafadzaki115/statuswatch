// ============================================
// Repository: Check
// ============================================

import type { SupabaseInstance, Check } from '../lib/types.js';

export interface CreateCheckData {
  monitor_id: string;
  status_code: number | null;
  response_ms: number;
  is_up: boolean;
  error: string | null;
  ssl_days_remaining: number | null;
}

export class CheckRepository {
  constructor(private readonly supabase: SupabaseInstance) {}

  /**
   * Mencatat satu baris hasil pengecekan baru ke tabel checks.
   */
  async create(data: CreateCheckData): Promise<Check> {
    const { data: created, error } = await this.supabase
      .from('checks')
      .insert({
        monitor_id: data.monitor_id,
        status_code: data.status_code,
        response_ms: Math.max(0, Math.round(data.response_ms)),
        is_up: data.is_up,
        error: data.error ? data.error.slice(0, 200) : null,
        ssl_days_remaining: data.ssl_days_remaining,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return created as Check;
  }

  /**
   * Mengambil riwayat check terbaru untuk monitor tertentu.
   */
  async listRecent(monitorId: string, limit: number = 20): Promise<Check[]> {
    const { data, error } = await this.supabase
      .from('checks')
      .select('*')
      .eq('monitor_id', monitorId)
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }
    return (data as Check[]) || [];
  }

  /**
   * Mengambil check sejak waktu tertentu (untuk kalkulasi uptime 24j/7h/30h).
   */
  async listSince(monitorId: string, sinceIso: string): Promise<Check[]> {
    const { data, error } = await this.supabase
      .from('checks')
      .select('*')
      .eq('monitor_id', monitorId)
      .gte('checked_at', sinceIso)
      .order('checked_at', { ascending: true });

    if (error) {
      throw error;
    }
    return (data as Check[]) || [];
  }

  /**
   * Menghapus checks yang lebih tua dari tanggal tertentu (retensi data cron).
   */
  async deleteOlderThan(cutoffIso: string, monitorIds?: string[]): Promise<number> {
    let query = this.supabase.from('checks').delete({ count: 'exact' }).lt('checked_at', cutoffIso);

    if (monitorIds && monitorIds.length > 0) {
      query = query.in('monitor_id', monitorIds);
    }

    const { count, error } = await query;
    if (error) {
      throw error;
    }
    return count || 0;
  }
}
