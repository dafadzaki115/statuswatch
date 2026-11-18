// ============================================
// Checker: Run Check (Orchestrator, sesuai PRD FR-5)
// ============================================

import type { CronRunSummary, SupabaseInstance } from '../lib/types.js';

/**
 * Orkestrasi pengecekan berkala: ambil monitor jatuh tempo,
 * jalankan check paralel (maks 10 concurrent), kelola insiden,
 * dan bersihkan data lama.
 * Implementasi akan ditambahkan pada tahap Cron endpoint.
 */
export async function runScheduledChecks(
  _supabase: SupabaseInstance
): Promise<CronRunSummary> {
  // TODO: Implementasi pada tahap fitur
  throw new Error('Not implemented');
}
