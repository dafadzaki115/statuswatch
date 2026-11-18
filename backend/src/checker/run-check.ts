// ============================================
// Checker: Run Check (Orchestrator, sesuai PRD FR-5 & FR-6)
// ============================================

import type {
  CronRunSummary,
  SupabaseInstance,
  Monitor,
  Check,
  CheckResult,
  SslCheckResult,
} from '../lib/types.js';
import { performHttpCheck } from './http-check.js';
import { performSslCheck } from './ssl-check.js';
import { CheckRepository } from '../repositories/check.repository.js';
import { MonitorRepository } from '../repositories/monitor.repository.js';
import { IncidentService } from '../services/incident.service.js';
import {
  sendMonitorDownAlert,
  sendMonitorRecoveredAlert,
  sendSslExpiryAlert,
} from '../notifications/email.service.js';

export interface SingleCheckExecutionResult {
  check: Check;
  result: CheckResult;
  incidentOpened: boolean;
  incidentResolved: boolean;
}

/**
 * Menjalankan pengecekan lengkap untuk satu monitor (HTTP + SSL jika https),
 * mencatat hasil ke checks, memproses state machine insiden, dan memperbarui monitors.
 */
export async function checkSingleMonitor(
  monitor: Monitor,
  supabase: SupabaseInstance
): Promise<SingleCheckExecutionResult> {
  const checkRepo = new CheckRepository(supabase);
  const monitorRepo = new MonitorRepository(supabase);
  const incidentService = new IncidentService(supabase);

  // 1. HTTP check (dengan proteksi SSRF)
  const httpResult = await performHttpCheck(
    monitor.url,
    monitor.method || 'GET',
    monitor.expected_status || 200,
    monitor.timeout_ms || 5000
  );

  // 2. SSL check jika protokol HTTPS
  let sslResult: SslCheckResult | null = null;
  if (monitor.url.toLowerCase().startsWith('https://')) {
    try {
      const parsed = new URL(monitor.url);
      sslResult = await performSslCheck(parsed.hostname, monitor.timeout_ms || 5000);
    } catch (sslErr: unknown) {
      sslResult = {
        expiresAt: null,
        daysRemaining: null,
        error: sslErr instanceof Error ? sslErr.message : 'SSL_CHECK_ERROR',
      };
    }
  }

  // 3. Catat ke tabel checks
  const check = await checkRepo.create({
    monitor_id: monitor.id,
    status_code: httpResult.statusCode,
    response_ms: httpResult.responseMs,
    is_up: httpResult.isUp,
    error: httpResult.error,
    ssl_days_remaining: sslResult?.daysRemaining ?? null,
  });

  // 4. Jalankan state machine deteksi insiden (PRD FR-6)
  const incidentResult = await incidentService.processCheckResult(
    monitor,
    httpResult.isUp,
    httpResult.error
  );

  // 5. Update tabel monitors dengan status terkini
  const sslExpiresAt = sslResult?.expiresAt
    ? sslResult.expiresAt.toISOString()
    : monitor.ssl_expires_at;

  await monitorRepo.updateStatus(monitor.id, {
    current_status: incidentResult.nextStatus,
    consecutive_failures: incidentResult.consecutiveFailures,
    last_checked_at: new Date().toISOString(),
    last_status_code: httpResult.statusCode,
    last_response_ms: httpResult.responseMs,
    ssl_expires_at: sslExpiresAt,
  });

  // 6. Notifikasi Email Resend (P2, aman & non-blocking)
  if (incidentResult.incidentOpened) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', monitor.owner_id)
        .maybeSingle();

      if (profile?.email) {
        await sendMonitorDownAlert(profile.email, monitor.name, monitor.url, httpResult.error);
      }
    } catch (err) {
      console.warn('[Email Alert] Error sending down alert:', err);
    }
  } else if (incidentResult.incidentResolved) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', monitor.owner_id)
        .maybeSingle();

      if (profile?.email) {
        await sendMonitorRecoveredAlert(profile.email, monitor.name, monitor.url);
      }
    } catch (err) {
      console.warn('[Email Alert] Error sending recovered alert:', err);
    }
  }

  // Peringatan SSL jika sisa hari <= 14 hari
  if (
    sslResult?.daysRemaining !== null &&
    sslResult?.daysRemaining !== undefined &&
    sslResult.daysRemaining <= 14 &&
    sslResult.daysRemaining > 0
  ) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', monitor.owner_id)
        .maybeSingle();

      if (profile?.email) {
        await sendSslExpiryAlert(
          profile.email,
          monitor.id,
          monitor.name,
          monitor.url,
          sslResult.daysRemaining
        );
      }
    } catch (err) {
      console.warn('[Email Alert] Error sending SSL warning:', err);
    }
  }

  return {
    check,
    result: {
      http: httpResult,
      ssl: sslResult,
    },
    incidentOpened: incidentResult.incidentOpened,
    incidentResolved: incidentResult.incidentResolved,
  };
}

/**
 * Menjalankan fungsi paralel dengan batas concurrency (PRD FR-5: maks 10).
 */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      const item = items[index];
      if (item === undefined) break;
      try {
        const val = await fn(item);
        results[index] = { status: 'fulfilled', value: val };
      } catch (err) {
        results[index] = { status: 'rejected', reason: err };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Orkestrasi pengecekan berkala (dipanggil oleh /api/cron/run-checks):
 * - Mengambil monitor aktif yang jatuh tempo (maks 100 monitor per run).
 * - Menjalankan check secara paralel dengan batas concurrency 10.
 * - Mengisolasi error antar monitor (fail-safe).
 * - Membersihkan data lama sesuai aturan retensi paket (Free 7 hari, Pro 30 hari).
 */
export async function runScheduledChecks(
  supabase: SupabaseInstance
): Promise<CronRunSummary> {
  const startTime = Date.now();
  const monitorRepo = new MonitorRepository(supabase);
  const checkRepo = new CheckRepository(supabase);

  // Ambil monitor aktif jatuh tempo (maks 100 per eksekusi, PRD FR-5)
  const dueMonitors = await monitorRepo.getDueMonitors(100);

  let upCount = 0;
  let downCount = 0;
  let incidentsOpened = 0;
  let incidentsResolved = 0;

  if (dueMonitors.length > 0) {
    const results = await runWithConcurrency(dueMonitors, 10, async (monitor) => {
      return await checkSingleMonitor(monitor, supabase);
    });

    for (const res of results) {
      if (res.status === 'fulfilled') {
        const val = res.value;
        if (val.result.http.isUp) {
          upCount++;
        } else {
          downCount++;
        }
        if (val.incidentOpened) {
          incidentsOpened++;
        }
        if (val.incidentResolved) {
          incidentsResolved++;
        }
      } else {
        downCount++;
        console.error('Check failed for monitor execution:', res.reason);
      }
    }
  }

  // Retensi data otomatis: hapus riwayat lama (Free 7 hari, Pro 30 hari)
  try {
    const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await checkRepo.deleteOlderThan(cutoff30d);

    const { data: freeProfiles } = await supabase.from('profiles').select('id').eq('plan', 'free');
    if (freeProfiles && freeProfiles.length > 0) {
      const freeUserIds = freeProfiles.map((p) => p.id);
      const { data: freeMons } = await supabase.from('monitors').select('id').in('owner_id', freeUserIds);
      if (freeMons && freeMons.length > 0) {
        const freeMonIds = freeMons.map((m) => m.id);
        const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        await checkRepo.deleteOlderThan(cutoff7d, freeMonIds);
      }
    }
  } catch (retentionErr) {
    console.error('Data retention error (non-fatal):', retentionErr);
  }

  const durationMs = Date.now() - startTime;

  return {
    checked: dueMonitors.length,
    up: upCount,
    down: downCount,
    incidents_opened: incidentsOpened,
    incidents_resolved: incidentsResolved,
    duration_ms: durationMs,
  };
}
