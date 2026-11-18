// ============================================
// Route Handler: /api/monitors
// GET: Mengambil seluruh monitor milik user login
// POST: Membuat monitor baru
// ============================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MonitorService, AppError, type PlanType } from '@statuswatch/backend';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const monitorService = new MonitorService(supabase);
    const monitors = await monitorService.listMonitors(user.id);

    return NextResponse.json({ data: monitors });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Ambil paket langganan pengguna
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = (profile?.plan || 'free') as PlanType;

    const body = await request.json().catch(() => ({}));
    const monitorService = new MonitorService(supabase);
    const created = await monitorService.createMonitor(user.id, body, plan);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}
