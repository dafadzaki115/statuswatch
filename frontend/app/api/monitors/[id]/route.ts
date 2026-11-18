// ============================================
// Route Handler: /api/monitors/[id]
// GET: Detail monitor
// PATCH: Memperbarui konfigurasi monitor
// DELETE: Menghapus monitor
// ============================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MonitorService, AppError, type PlanType } from '@statuswatch/backend';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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
    const monitor = await monitorService.getMonitorById(id, user.id);

    return NextResponse.json({ data: monitor });
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = (profile?.plan || 'free') as PlanType;

    const body = await request.json().catch(() => ({}));
    const monitorService = new MonitorService(supabase);
    const updated = await monitorService.updateMonitor(id, user.id, body, plan);

    return NextResponse.json({ data: updated });
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

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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
    await monitorService.deleteMonitor(id, user.id);

    return NextResponse.json({ message: 'Monitor berhasil dihapus' });
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
