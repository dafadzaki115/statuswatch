// ============================================
// Service: Plan
// ============================================

import type { SupabaseInstance, PlanType, Profile } from '../lib/types.js';
import { ProfileRepository } from '../repositories/profile.repository.js';
import { MonitorRepository } from '../repositories/monitor.repository.js';
import { StatusPageRepository } from '../repositories/status-page.repository.js';
import { updatePlanSchema } from '../validators/plan.validator.js';
import { AppError } from '../lib/errors.js';
import { ErrorCode } from '../lib/types.js';

export class PlanService {
  private readonly profileRepo: ProfileRepository;
  private readonly monitorRepo: MonitorRepository;
  private readonly statusPageRepo: StatusPageRepository;

  constructor(private readonly supabase: SupabaseInstance) {
    this.profileRepo = new ProfileRepository(supabase);
    this.monitorRepo = new MonitorRepository(supabase);
    this.statusPageRepo = new StatusPageRepository(supabase);
  }

  /**
   * Mengubah paket langganan pengguna (simulasi SaaS sesuai PRD Bagian 8 & FR-11):
   * - Validasi skema (hanya 'free' atau 'pro').
   * - Jika downgrade ke Free, pastikan jumlah monitor <= 3 dan status page <= 1.
   * - Tolak jika melebihi batas dengan pesan instruktif ("Hapus X monitor terlebih dahulu").
   */
  async updatePlan(userId: string, input: unknown): Promise<Profile> {
    const validation = updatePlanSchema.safeParse(input);
    if (!validation.success) {
      const msg = validation.error.issues[0]?.message || 'Pilihan paket tidak valid';
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, msg);
    }

    const { plan: targetPlan } = validation.data;

    // Jika downgrade ke paket Free, periksa apakah jumlah monitor atau status page melebihi kuota Free
    if (targetPlan === 'free') {
      const monitorCount = await this.monitorRepo.countByOwner(userId);
      if (monitorCount > 3) {
        const excess = monitorCount - 3;
        throw new AppError(
          400,
          ErrorCode.PLAN_LIMIT_REACHED,
          `Tidak dapat turun ke paket Free karena Anda memiliki ${monitorCount} monitor (maksimal paket Free adalah 3). Hapus ${excess} monitor terlebih dahulu.`
        );
      }

      const statusPageCount = await this.statusPageRepo.countByOwner(userId);
      if (statusPageCount > 1) {
        const excess = statusPageCount - 1;
        throw new AppError(
          400,
          ErrorCode.PLAN_LIMIT_REACHED,
          `Tidak dapat turun ke paket Free karena Anda memiliki ${statusPageCount} status page (maksimal paket Free adalah 1). Hapus ${excess} status page terlebih dahulu.`
        );
      }
    }

    return this.profileRepo.updatePlan(userId, targetPlan as PlanType);
  }
}
