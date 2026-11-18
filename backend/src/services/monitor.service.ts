// ============================================
// Service: Monitor
// ============================================

import type { SupabaseInstance, Monitor, PlanType } from '../lib/types.js';
import { AppError } from '../lib/errors.js';
import { ErrorCode } from '../lib/types.js';
import { MonitorRepository } from '../repositories/monitor.repository.js';
import {
  createMonitorSchema,
  updateMonitorSchema,
  resolveMonitorInterval,
  type CreateMonitorInput,
  type UpdateMonitorInput,
} from '../validators/monitor.validator.js';
import {
  assertCanCreateMonitor,
  assertIntervalAllowedForPlan,
} from '../lib/plans.js';
import { validateUrlNotSSRF } from '../security/ssrf-guard.js';

export class MonitorService {
  private readonly monitorRepo: MonitorRepository;

  constructor(private readonly supabase: SupabaseInstance) {
    this.monitorRepo = new MonitorRepository(supabase);
  }

  /**
   * Mengambil seluruh daftar monitor milik owner tertentu.
   */
  async listMonitors(ownerId: string): Promise<Monitor[]> {
    return this.monitorRepo.listByOwner(ownerId);
  }

  /**
   * Mengambil detail satu monitor berdasarkan ID dan owner.
   */
  async getMonitorById(id: string, ownerId: string): Promise<Monitor> {
    const monitor = await this.monitorRepo.findById(id, ownerId);
    if (!monitor) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Monitor tidak ditemukan');
    }
    return monitor;
  }

  /**
   * Membuat monitor baru dengan validasi skema, proteksi SSRF, dan penegakan limit paket.
   */
  async createMonitor(
    ownerId: string,
    rawInput: unknown,
    plan: PlanType = 'free'
  ): Promise<Monitor> {
    // 1. Validasi input dasar dengan Zod
    const parsed = createMonitorSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        parsed.error.issues[0]?.message || 'Input monitor tidak valid'
      );
    }
    const input: CreateMonitorInput = parsed.data;

    // 2. Proteksi SSRF pada URL
    validateUrlNotSSRF(input.url);

    // 3. Normalisasi & penegakan limit interval paket di backend
    const intervalMinutes = resolveMonitorInterval(input.interval_minutes, plan);

    // 4. Penegakan batas kuota monitor paket di backend
    const currentCount = await this.monitorRepo.countByOwner(ownerId);
    assertCanCreateMonitor(currentCount, plan);

    // 5. Simpan ke database
    return this.monitorRepo.create({
      owner_id: ownerId,
      name: input.name,
      url: input.url,
      method: input.method,
      interval_minutes: intervalMinutes,
      expected_status: input.expected_status,
      timeout_ms: input.timeout_ms,
      status_page_id: input.status_page_id,
      is_active: input.is_active,
    });
  }

  /**
   * Memperbarui monitor yang sudah ada dengan validasi kepemilikan dan aturan paket.
   */
  async updateMonitor(
    id: string,
    ownerId: string,
    rawInput: unknown,
    plan: PlanType = 'free'
  ): Promise<Monitor> {
    // 1. Cek kepemilikan monitor
    const existing = await this.getMonitorById(id, ownerId);

    // 2. Validasi input parsial
    const parsed = updateMonitorSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        parsed.error.issues[0]?.message || 'Input pembaruan tidak valid'
      );
    }
    const input: UpdateMonitorInput = parsed.data;

    // 3. Jika URL diubah, jalankan proteksi SSRF
    if (input.url && input.url !== existing.url) {
      validateUrlNotSSRF(input.url);
    }

    // 4. Jika interval diubah, validasi batas paket
    if (input.interval_minutes !== undefined) {
      assertIntervalAllowedForPlan(input.interval_minutes, plan);
    }

    // 5. Lakukan update
    const updated = await this.monitorRepo.update(id, ownerId, {
      name: input.name,
      url: input.url,
      method: input.method,
      interval_minutes: input.interval_minutes,
      expected_status: input.expected_status,
      timeout_ms: input.timeout_ms,
      status_page_id: input.status_page_id,
      is_active: input.is_active,
    });

    if (!updated) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Gagal memperbarui monitor');
    }
    return updated;
  }

  /**
   * Menghapus monitor berdasarkan ID dan kepemilikan.
   */
  async deleteMonitor(id: string, ownerId: string): Promise<void> {
    // Pastikan monitor ada dan milik owner
    await this.getMonitorById(id, ownerId);

    const deleted = await this.monitorRepo.delete(id, ownerId);
    if (!deleted) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Gagal menghapus monitor');
    }
  }
}
