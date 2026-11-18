// ============================================
// Service: Incident (State Machine sesuai PRD FR-6)
// ============================================

import type { SupabaseInstance, Monitor, MonitorStatus, Incident } from '../lib/types.js';
import { IncidentRepository } from '../repositories/incident.repository.js';

export interface ProcessCheckResultOutput {
  nextStatus: MonitorStatus;
  consecutiveFailures: number;
  incidentOpened: boolean;
  incidentResolved: boolean;
  incident: Incident | null;
}

/**
 * Business logic untuk deteksi dan manajemen insiden otomatis.
 *
 * Sesuai PRD FR-6:
 * - consecutive_failures bertambah tiap check gagal, reset 0 jika sukses.
 * - Saat consecutive_failures >= 2 dan belum ada insiden open:
 *   buka insiden open dengan judul "{name} tidak dapat diakses" dan simpan last_error.
 *   current_status berubah menjadi 'down'.
 * - Saat check sukses dan ada insiden open:
 *   tutup insiden (resolved), current_status menjadi 'up'.
 */
export class IncidentService {
  private readonly incidentRepo: IncidentRepository;

  constructor(private readonly supabase: SupabaseInstance) {
    this.incidentRepo = new IncidentRepository(supabase);
  }

  /**
   * Menjalankan state machine deteksi insiden berdasarkan hasil pengecekan monitor.
   */
  async processCheckResult(
    monitor: Monitor,
    isUp: boolean,
    lastError: string | null
  ): Promise<ProcessCheckResultOutput> {
    const openIncident = await this.incidentRepo.findOpenByMonitorId(monitor.id);

    if (isUp) {
      // Pengecekan BERHASIL
      let resolvedIncident: Incident | null = null;
      let incidentResolved = false;

      if (openIncident) {
        resolvedIncident = await this.incidentRepo.resolve(openIncident.id);
        incidentResolved = true;
      }

      return {
        nextStatus: 'up',
        consecutiveFailures: 0,
        incidentOpened: false,
        incidentResolved,
        incident: resolvedIncident,
      };
    }

    // Pengecekan GAGAL
    const newConsecutiveFailures = (monitor.consecutive_failures || 0) + 1;

    if (newConsecutiveFailures >= 2) {
      let activeIncident = openIncident;
      let incidentOpened = false;

      if (!activeIncident) {
        activeIncident = await this.incidentRepo.create({
          monitor_id: monitor.id,
          title: `${monitor.name} tidak dapat diakses`,
          last_error: lastError,
        });
        incidentOpened = true;
      }

      return {
        nextStatus: 'down',
        consecutiveFailures: newConsecutiveFailures,
        incidentOpened,
        incidentResolved: false,
        incident: activeIncident,
      };
    }

    // Gagal pertama kali (consecutive_failures == 1): belum dianggap down secara penuh untuk mencegah flapping
    return {
      nextStatus: monitor.current_status === 'unknown' ? 'unknown' : monitor.current_status,
      consecutiveFailures: newConsecutiveFailures,
      incidentOpened: false,
      incidentResolved: false,
      incident: null,
    };
  }
}
