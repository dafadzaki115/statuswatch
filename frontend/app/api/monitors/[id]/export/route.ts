// ============================================
// Route Handler: GET /api/monitors/[id]/export
// Ekspor riwayat checks monitor ke file CSV (Tahap 14 P2)
// ============================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MonitorRepository, CheckRepository } from '@statuswatch/backend';

export const dynamic = 'force-dynamic';

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
        { error: { code: 'UNAUTHORIZED', message: 'Silakan login terlebih dahulu' } },
        { status: 401 }
      );
    }

    // 1. Verifikasi kepemilikan monitor
    const monitorRepo = new MonitorRepository(supabase);
    const monitor = await monitorRepo.findById(id, user.id);

    if (!monitor) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Monitor tidak ditemukan' } },
        { status: 404 }
      );
    }

    // 2. Ambil riwayat check (hingga 500 baris terbaru)
    const checkRepo = new CheckRepository(supabase);
    const checks = await checkRepo.listRecent(id, 500);

    // 3. Susun data CSV dengan UTF-8 BOM untuk kompatibilitas Microsoft Excel
    const BOM = '\uFEFF';
    const headers = [
      'ID Check',
      'Waktu Pengecekan (WIB)',
      'Status',
      'HTTP Status Code',
      'Response Time (ms)',
      'Sisa Hari SSL',
      'Keterangan / Error',
    ];

    const escapeCsv = (str: string | number | null | undefined): string => {
      if (str === null || str === undefined) return '';
      const stringVal = String(str);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const rows = checks.map((c) => {
      const timeStr = new Date(c.checked_at).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      return [
        escapeCsv(c.id),
        escapeCsv(timeStr),
        escapeCsv(c.is_up ? 'UP' : 'DOWN'),
        escapeCsv(c.status_code || '-'),
        escapeCsv(c.response_ms),
        escapeCsv(c.ssl_days_remaining !== null ? `${c.ssl_days_remaining} hari` : '-'),
        escapeCsv(c.error || 'Normal'),
      ].join(',');
    });

    const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');
    const safeFilename = monitor.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'monitor';

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="statuswatch-${safeFilename}-checks.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    console.error('Error exporting monitor CSV:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Gagal mengekspor riwayat ke CSV' } },
      { status: 500 }
    );
  }
}
