import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Endpoint simulasi untuk demonstrasi monitor status ketersediaan (PRD Bagian 16):
 * - Default: mengembalikan 200 OK dengan pesan "Service Operational"
 * - Mode Down (?mode=down): mengembalikan HTTP 503 Service Unavailable untuk memicu deteksi insiden otomatis
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  if (mode === 'down') {
    return NextResponse.json(
      {
        status: 'error',
        code: 503,
        message: 'Simulated Outage: Layanan sedang mengalami gangguan sementara.',
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: 'ok',
      code: 200,
      message: 'Service Operational: Sistem berjalan normal.',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
