// Route Handler: POST /api/cron/run-checks
// Dipanggil oleh GitHub Actions scheduler
// Penghubung ke @statuswatch/backend — implementasi pada tahap Cron

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  // TODO: Panggil verifyCronSecret + runScheduledChecks dari @statuswatch/backend
  return NextResponse.json({ message: 'POST /api/cron/run-checks — belum diimplementasikan' }, { status: 501 });
}
