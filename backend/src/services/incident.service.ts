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

export interface IncidentStateTransition {
  nextStatus: MonitorStatus;
  consecutiveFailures: number;
  shouldOpenIncident: boolean;
  shouldResolveIncident: boolean;
}

/**
 * Fungsi murni (pure function) untuk menghitung transisi state machine insiden.
 */
export function computeIncidentState(
  currentConsecutiveFailures: number,
  currentStatus: MonitorStatus,
  hasOpenIncident: boolean,
  isUp: boolean
): IncidentStateTransition {
  if (isUp) {
    return {
      nextStatus: 'up',
      consecutiveFailures: 0,
      shouldOpenIncident: false,
      shouldResolveIncident: hasOpenIncident,
    };
  }

  const failures = currentConsecutiveFailures + 1;
  if (failures >= 2) {
    return {
      nextStatus: 'down',
      consecutiveFailures: failures,
      shouldOpenIncident: !hasOpenIncident,
      shouldResolveIncident: false,
    };
  }

  return {
    nextStatus: currentStatus === 'unknown' ? 'unknown' : currentStatus,
    consecutiveFailures: failures,
    shouldOpenIncident: false,
    shouldResolveIncident: false,
  };
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

    const transition = computeIncidentState(
      monitor.consecutive_failures || 0,
      monitor.current_status,
      Boolean(openIncident),
      isUp
    );

    if (isUp) {
      let resolvedIncident: Incident | null = null;
      if (transition.shouldResolveIncident && openIncident) {
        resolvedIncident = await this.incidentRepo.resolve(openIncident.id);
      }

      return {
        nextStatus: transition.nextStatus,
        consecutiveFailures: transition.consecutiveFailures,
        incidentOpened: false,
        incidentResolved: transition.shouldResolveIncident,
        incident: resolvedIncident,
      };
    }

    // Gagal
    let activeIncident = openIncident;
    let incidentOpened = false;

    if (transition.shouldOpenIncident) {
      activeIncident = await this.incidentRepo.create({
        monitor_id: monitor.id,
        title: `${monitor.name} tidak dapat diakses`,
        last_error: lastError,
      });
      incidentOpened = true;
    }

    return {
      nextStatus: transition.nextStatus,
      consecutiveFailures: transition.consecutiveFailures,
      incidentOpened,
      incidentResolved: false,
      incident: activeIncident,
    };
  }
}
