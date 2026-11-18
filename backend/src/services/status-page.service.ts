// ============================================
// Service: Status Page
// ============================================

import type { SupabaseInstance, StatusPage, PlanType, Incident } from '../lib/types.js';
import { StatusPageRepository } from '../repositories/status-page.repository.js';
import { IncidentRepository } from '../repositories/incident.repository.js';
import { createStatusPageSchema, updateStatusPageSchema } from '../validators/status-page.validator.js';
import { assertCanCreateStatusPage } from '../lib/plans.js';
import { AppError } from '../lib/errors.js';
import { ErrorCode } from '../lib/types.js';
import { calculateDailyUptimeSegments, calculateUptimePercent, type DailyUptimeSegment } from '../lib/uptime.js';

export interface PublicMonitorData {
  id: string;
  name: string;
  current_status: 'up' | 'down' | 'unknown';
  uptimePercent: number | null;
  last_response_ms: number | null;
  dailySegments: DailyUptimeSegment[];
}

export interface PublicStatusPagePayload {
  title: string;
  description: string | null;
  slug: string;
  aggregateStatus: 'operational' | 'degraded' | 'major_outage';
  aggregateLabel: string;
  monitors: PublicMonitorData[];
  activeIncidents: Incident[];
  pastIncidents: Incident[];
}

export class StatusPageService {
  private readonly statusPageRepo: StatusPageRepository;
  private readonly incidentRepo: IncidentRepository;

  constructor(private readonly supabase: SupabaseInstance) {
    this.statusPageRepo = new StatusPageRepository(supabase);
    this.incidentRepo = new IncidentRepository(supabase);
  }

  /**
   * Mengambil seluruh status page milik user login.
   */
  async listStatusPages(ownerId: string): Promise<StatusPage[]> {
    return this.statusPageRepo.listByOwner(ownerId);
  }

  /**
   * Mengambil detail satu status page milik user.
   */
  async getStatusPageById(id: string, ownerId: string): Promise<StatusPage> {
    const page = await this.statusPageRepo.findById(id, ownerId);
    if (!page) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Status page tidak ditemukan');
    }
    return page;
  }

  /**
   * Mengecek ketersediaan slug.
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const isTaken = await this.statusPageRepo.isSlugTaken(slug, excludeId);
    return !isTaken;
  }

  /**
   * Membuat status page baru dengan validasi skema, keunikan slug, dan kuota paket.
   */
  async createStatusPage(ownerId: string, input: unknown, plan: PlanType = 'free'): Promise<StatusPage> {
    // 1. Validasi batas kuota paket
    const currentCount = await this.statusPageRepo.countByOwner(ownerId);
    assertCanCreateStatusPage(currentCount, plan);

    // 2. Validasi skema Zod
    const validation = createStatusPageSchema.safeParse(input);
    if (!validation.success) {
      const msg = validation.error.issues[0]?.message || 'Data status page tidak valid';
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, msg);
    }

    const data = validation.data;

    // 3. Validasi keunikan slug di server
    const isTaken = await this.statusPageRepo.isSlugTaken(data.slug);
    if (isTaken) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, `Slug "${data.slug}" sudah digunakan. Silakan pilih slug lain.`);
    }

    // 4. Simpan ke database
    return this.statusPageRepo.create({
      owner_id: ownerId,
      slug: data.slug,
      title: data.title,
      description: data.description,
      is_public: data.is_public ?? true,
    });
  }

  /**
   * Memperbarui status page.
   */
  async updateStatusPage(id: string, ownerId: string, input: unknown): Promise<StatusPage> {
    const validation = updateStatusPageSchema.safeParse(input);
    if (!validation.success) {
      const msg = validation.error.issues[0]?.message || 'Data perbaruan status page tidak valid';
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, msg);
    }

    const data = validation.data;

    if (data.slug) {
      const isTaken = await this.statusPageRepo.isSlugTaken(data.slug, id);
      if (isTaken) {
        throw new AppError(400, ErrorCode.VALIDATION_ERROR, `Slug "${data.slug}" sudah digunakan. Silakan pilih slug lain.`);
      }
    }

    const updated = await this.statusPageRepo.update(id, ownerId, data);
    if (!updated) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Status page tidak ditemukan');
    }
    return updated;
  }

  /**
   * Menghapus status page.
   */
  async deleteStatusPage(id: string, ownerId: string): Promise<void> {
    const deleted = await this.statusPageRepo.delete(id, ownerId);
    if (!deleted) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Status page tidak ditemukan');
    }
  }

  /**
   * Mengambil data halaman publik secara aman (sesuai PRD FR-10 & Bagian 12 Keamanan):
   * - Menolak jika slug tidak ditemukan atau is_public = false (menghasilkan 404).
   * - Tidak membocorkan owner_id, email pemilik, pesan error mentah, atau URL monitor.
   * - Menghitung agregat status, bar uptime 90 hari, dan riwayat insiden 14 hari terakhir.
   */
  async getPublicStatusPageData(slug: string): Promise<PublicStatusPagePayload> {
    const page = await this.statusPageRepo.findBySlug(slug);
    if (!page || !page.is_public) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Halaman status tidak ditemukan');
    }

    // Ambil monitor aktif yang ditautkan ke status page ini
    const { data: monitorsData, error: monError } = await this.supabase
      .from('monitors')
      .select('id, name, current_status, last_response_ms, is_active')
      .eq('status_page_id', page.id)
      .eq('is_active', true);

    if (monError) {
      throw monError;
    }

    const monitors = monitorsData || [];
    const monitorIds = monitors.map((m) => m.id);

    // Hitung status agregat
    let aggregateStatus: 'operational' | 'degraded' | 'major_outage' = 'operational';
    let aggregateLabel = 'Semua sistem normal';

    if (monitors.length > 0) {
      const downCount = monitors.filter((m) => m.current_status === 'down').length;
      if (downCount === monitors.length) {
        aggregateStatus = 'major_outage';
        aggregateLabel = 'Gangguan layanan';
      } else if (downCount > 0) {
        aggregateStatus = 'degraded';
        aggregateLabel = 'Sebagian layanan terganggu';
      }
    }

    // Ambil checks 90 hari untuk bar uptime
    const ninetyDaysAgoIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const checksByMonitor = new Map<string, { checked_at: string; is_up: boolean }[]>();

    if (monitorIds.length > 0) {
      const { data: checks } = await this.supabase
        .from('checks')
        .select('monitor_id, checked_at, is_up')
        .in('monitor_id', monitorIds)
        .gte('checked_at', ninetyDaysAgoIso);

      if (checks) {
        for (const c of checks) {
          const list = checksByMonitor.get(c.monitor_id) || [];
          list.push(c);
          checksByMonitor.set(c.monitor_id, list);
        }
      }
    }

    // Format data monitor publik
    const publicMonitors: PublicMonitorData[] = monitors.map((m) => {
      const monChecks = checksByMonitor.get(m.id) || [];
      const uptimePercent = calculateUptimePercent(monChecks);
      const dailySegments = calculateDailyUptimeSegments(monChecks, 90);

      return {
        id: m.id,
        name: m.name,
        current_status: m.current_status,
        uptimePercent,
        last_response_ms: m.last_response_ms,
        dailySegments,
      };
    });

    // Ambil insiden 14 hari terakhir untuk monitor-monitor ini
    const fourteenDaysAgoIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const incidents = await this.incidentRepo.listByMonitorIds(monitorIds, fourteenDaysAgoIso);

    // Sanitasi insiden (hapus pesan stack trace atau data sensitif, pertahankan title aman)
    const sanitizedIncidents = incidents.map((inc) => ({
      ...inc,
      last_error: null, // PRD FR-10: jangan menampilkan pesan error mentah ke publik
    }));

    const activeIncidents = sanitizedIncidents.filter((inc) => inc.status === 'open');
    const pastIncidents = sanitizedIncidents.filter((inc) => inc.status === 'resolved');

    return {
      title: page.title,
      description: page.description,
      slug: page.slug,
      aggregateStatus,
      aggregateLabel,
      monitors: publicMonitors,
      activeIncidents,
      pastIncidents,
    };
  }
}
