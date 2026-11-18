// Route Handler: POST /api/cron/run-checks
// Dipanggil oleh GitHub Actions scheduler sesuai PRD FR-5 & Tahap 7

import { NextResponse } from 'next/server';
import {
  supabaseAdmin,
  runScheduledChecks,
  verifyCronSecret,
  AppError,
  ErrorCode,
} from '@statuswatch/backend';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // 1. Verifikasi secret cron menggunakan constant-time comparison (PRD Bagian 12 & FR-5)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured in environment variables');
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.INTERNAL,
            message: 'CRON_SECRET belum dikonfigurasi di server',
          },
        },
        { status: 500 }
      );
    }

    verifyCronSecret(authHeader, cronSecret);

    // 2. Jalankan pengecekan monitor berkala menggunakan service role
    const summary = await runScheduledChecks(supabaseAdmin);

    // 3. Kembalikan ringkasan eksekusi cron
    return NextResponse.json(summary, { status: 200 });
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

    console.error('Cron run-checks unexpected error:', err);
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.INTERNAL,
          message: 'Terjadi kesalahan saat menjalankan cron pengecekan',
        },
      },
      { status: 500 }
    );
  }
}
