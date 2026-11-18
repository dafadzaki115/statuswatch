// ============================================
// Service: Incident
// ============================================

import type { SupabaseInstance } from '../lib/types.js';

/**
 * Business logic untuk manajemen insiden otomatis.
 * State machine: consecutive_failures >= 2 → open incident.
 * Check sukses + open incident → resolve.
 * Implementasi akan ditambahkan pada tahap Incident Management.
 */
export class IncidentService {
  constructor(private readonly supabase: SupabaseInstance) {}

  // TODO: Implementasi pada tahap fitur
}
