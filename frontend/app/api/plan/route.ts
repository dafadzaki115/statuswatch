// ============================================
// Route Handler: PATCH /api/plan
// Simulasi upgrade / downgrade paket langganan (PRD FR-11 & Bagian 8)
// ============================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin, PlanService, AppError } from '@statuswatch/backend';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Silakan masuk terlebih dahulu' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Gunakan supabaseAdmin (service role) karena kolom plan di tabel profiles
    // diproteksi dari modifikasi langsung pengguna oleh RLS
    const planService = new PlanService(supabaseAdmin);
    const updatedProfile = await planService.updatePlan(user.id, body);

    return NextResponse.json({
      data: {
        plan: updatedProfile.plan,
        email: updatedProfile.email,
        message: `Paket berhasil diperbarui menjadi ${updatedProfile.plan.toUpperCase()}`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Terjadi kesalahan server saat memperbarui paket' } },
      { status: 500 }
    );
  }
}
