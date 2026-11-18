// ============================================
// Route Handler: /api/status-pages
// GET: Mengambil daftar status page milik user login
// POST: Membuat status page baru
// ============================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StatusPageService, AppError, type PlanType } from '@statuswatch/backend';

export async function GET(request: NextRequest) {
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

    const service = new StatusPageService(supabase);

    // Jika ada query param checkSlug, lakukan pengecekan ketersediaan slug
    const url = new URL(request.url);
    const checkSlug = url.searchParams.get('checkSlug');
    if (checkSlug) {
      const excludeId = url.searchParams.get('excludeId') || undefined;
      const isAvailable = await service.isSlugAvailable(checkSlug, excludeId);
      return NextResponse.json({ available: isAvailable });
    }

    const pages = await service.listStatusPages(user.id);
    return NextResponse.json({ data: pages });
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = (profile?.plan || 'free') as PlanType;
    const body = await request.json().catch(() => ({}));

    const service = new StatusPageService(supabase);
    const created = await service.createStatusPage(user.id, body, plan);

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
