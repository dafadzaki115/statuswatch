// ============================================
// Repository: Incident
// ============================================

import type { SupabaseInstance, Incident } from '../lib/types.js';

export interface CreateIncidentData {
  monitor_id: string;
  title: string;
  last_error?: string | null;
}

/**
 * Repository untuk operasi data insiden di Supabase.
 * Mengelola tabel public.incidents sesuai PRD FR-6.
 */
export class IncidentRepository {
  constructor(private readonly supabase: SupabaseInstance) {}

  /**
   * Mengambil insiden yang sedang berstatus 'open' untuk monitor tertentu jika ada.
   */
  async findOpenByMonitorId(monitorId: string): Promise<Incident | null> {
    const { data, error } = await this.supabase
      .from('incidents')
      .select('*')
      .eq('monitor_id', monitorId)
      .eq('status', 'open')
      .maybeSingle();

    if (error) {
      throw error;
    }
    return (data as Incident) || null;
  }

  /**
   * Membuat insiden baru berstatus 'open'.
   * Jika sudah ada insiden open (karena unique partial index), tangani dengan idempotensi.
   */
  async create(data: CreateIncidentData): Promise<Incident> {
    const { data: created, error } = await this.supabase
      .from('incidents')
      .insert({
        monitor_id: data.monitor_id,
        title: data.title,
        status: 'open',
        last_error: data.last_error ? data.last_error.slice(0, 255) : null,
      })
      .select()
      .single();

    if (error) {
      // 23505 is PostgreSQL unique_violation (one_open_incident_per_monitor)
      if (error.code === '23505') {
        const existing = await this.findOpenByMonitorId(data.monitor_id);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }

    return created as Incident;
  }

  /**
   * Menutup insiden: mengubah status menjadi 'resolved' dan mengisi resolved_at.
   */
  async resolve(incidentId: string): Promise<Incident> {
    const { data, error } = await this.supabase
      .from('incidents')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', incidentId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Incident;
  }

  /**
   * Mengambil riwayat insiden untuk monitor tertentu diurutkan dari terbaru.
   */
  async listByMonitorId(monitorId: string, limit: number = 20): Promise<Incident[]> {
    const { data, error } = await this.supabase
      .from('incidents')
      .select('*')
      .eq('monitor_id', monitorId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }
    return (data as Incident[]) || [];
  }

  /**
   * Mengambil insiden aktif dan riwayat insiden untuk beberapa monitor (misal untuk status page).
   */
  async listByMonitorIds(monitorIds: string[], sinceIso?: string): Promise<Incident[]> {
    if (!monitorIds || monitorIds.length === 0) return [];
    let query = this.supabase
      .from('incidents')
      .select('*')
      .in('monitor_id', monitorIds)
      .order('started_at', { ascending: false });

    if (sinceIso) {
      query = query.gte('started_at', sinceIso);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return (data as Incident[]) || [];
  }
}
