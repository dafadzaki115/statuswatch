// Route Handler: POST /api/monitors/[id]/check
// Pengecekan on-demand ("Check now") sesuai PRD FR-6 & FR-8

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  supabaseAdmin,
  MonitorRepository,
  checkSingleMonitor,
  checkRateLimit,
  AppError,
  ErrorCode,
} from '@statuswatch/backend';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Autentikasi pengguna
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Silakan login terlebih dahulu',
          },
        },
        { status: 401 }
      );
    }

    // 2. Proteksi Rate Limit: 5 kali per menit per user (PRD FR-8)
    checkRateLimit(`check-now:${user.id}`, 5, 60 * 1000);

    // 3. Ambil monitor dan pastikan milik user (RLS / ownership check)
    const monitorRepo = new MonitorRepository(supabase);
    const monitor = await monitorRepo.findById(id, user.id);

    if (!monitor) {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Monitor tidak ditemukan',
          },
        },
        { status: 404 }
      );
    }

    // 4. Jalankan pengecekan dengan service role (diperlukan untuk insert checks & incidents)
    const executionResult = await checkSingleMonitor(monitor, supabaseAdmin);

    // 5. Berikan respons seragam
    return NextResponse.json({
      data: {
        isUp: executionResult.result.http.isUp,
        statusCode: executionResult.result.http.statusCode,
        responseMs: executionResult.result.http.responseMs,
        error: executionResult.result.http.error,
        ssl: executionResult.result.ssl,
        check: executionResult.check,
        incidentOpened: executionResult.incidentOpened,
        incidentResolved: executionResult.incidentResolved,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        {
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: err.statusCode }
      );
    }

    console.error('Error on POST /api/monitors/[id]/check:', err);
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.INTERNAL,
          message: 'Terjadi kesalahan internal saat memeriksa monitor',
        },
      },
      { status: 500 }
    );
  }
}
