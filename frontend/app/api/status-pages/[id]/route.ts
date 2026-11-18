// ============================================
// Route Handler: /api/status-pages/[id]
// GET: Detail status page
// PATCH: Memperbarui status page
// DELETE: Menghapus status page
// ============================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StatusPageService, AppError } from '@statuswatch/backend';

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

    const service = new StatusPageService(supabase);
    const page = await service.getStatusPageById(id, user.id);

    return NextResponse.json({ data: page });
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

    const body = await request.json().catch(() => ({}));
    const service = new StatusPageService(supabase);
    const updated = await service.updateStatusPage(id, user.id, body);

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

    const service = new StatusPageService(supabase);
    await service.deleteStatusPage(id, user.id);

    return NextResponse.json({ message: 'Status page berhasil dihapus' });
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
