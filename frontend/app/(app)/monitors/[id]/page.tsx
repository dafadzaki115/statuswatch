import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  PauseCircle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Download,
} from 'lucide-react';
import { CheckNowButton } from './check-now-button';
import { PauseResumeButton } from '@/components/pause-resume-button';
import { DeleteMonitorDialog } from '@/components/delete-monitor-dialog';
import { ResponseChart, type ChartCheckPoint } from '@/components/response-chart';
import { IncidentList } from '@/components/incident-list';
import type { Monitor, Check, Incident } from '@statuswatch/backend';
import { calculateUptimePercent, calculateAverageResponseTime } from '@statuswatch/backend';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MonitorDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Ambil data monitor milik user
  const { data: monitor } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (!monitor) {
    notFound();
  }

  const m = monitor as Monitor;
  const isPaused = !m.is_active;
  const isUp = m.current_status === 'up';
  const isDown = m.current_status === 'down';

  const now = new Date();
  const past24hIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const past7dIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const past30dIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 2. Ambil riwayat check untuk kalkulasi metrik & grafik
  const [
    { data: checks24hData },
    { data: checks7dData },
    { data: checks30dData },
    { data: recent50ChecksData },
    { data: incidentsData },
  ] = await Promise.all([
    supabase
      .from('checks')
      .select('checked_at, response_ms, is_up, status_code')
      .eq('monitor_id', id)
      .gte('checked_at', past24hIso)
      .order('checked_at', { ascending: true }),
    supabase
      .from('checks')
      .select('checked_at, response_ms, is_up, status_code')
      .eq('monitor_id', id)
      .gte('checked_at', past7dIso)
      .order('checked_at', { ascending: true }),
    supabase
      .from('checks')
      .select('is_up')
      .eq('monitor_id', id)
      .gte('checked_at', past30dIso),
    supabase
      .from('checks')
      .select('*')
      .eq('monitor_id', id)
      .order('checked_at', { ascending: false })
      .limit(50),
    supabase
      .from('incidents')
      .select('*')
      .eq('monitor_id', id)
      .order('started_at', { ascending: false })
      .limit(30),
  ]);

  const checks24h = checks24hData || [];
  const checks7d = checks7dData || [];
  const checks30d = checks30dData || [];
  const recent50Checks = (recent50ChecksData as Check[]) || [];
  const incidents = (incidentsData as Incident[]) || [];

  // Metrik kalkulasi
  const uptime24h = calculateUptimePercent(checks24h);
  const uptime7d = calculateUptimePercent(checks7d);
  const uptime30d = calculateUptimePercent(checks30d);
  const avgResponseMs = calculateAverageResponseTime(checks24h);

  // Sisa hari SSL
  let sslDays: number | null = null;
  if (m.ssl_expires_at) {
    const diffMs = new Date(m.ssl_expires_at).getTime() - now.getTime();
    sslDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Format data point grafik Recharts
  const chartPoints24h: ChartCheckPoint[] = checks24h.map((c) => ({
    time: new Date(c.checked_at).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }),
    responseMs: c.response_ms,
    isUp: c.is_up,
    statusCode: c.status_code,
  }));

  const chartPoints7d: ChartCheckPoint[] = checks7d.map((c) => ({
    time: new Date(c.checked_at).toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }),
    responseMs: c.response_ms,
    isUp: c.is_up,
    statusCode: c.status_code,
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div>
        <Link
          href="/monitors"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Monitor</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {m.name}
              </h1>

              {isPaused ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <PauseCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dijeda</span>
                </span>
              ) : isUp ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>OPERASIONAL (UP)</span>
                </span>
              ) : isDown ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200/60 dark:border-red-800/40">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>GANGGUAN (DOWN)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>MENUNGGU CEK</span>
                </span>
              )}
            </div>

            <a
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>{m.url}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Action Buttons: Check Now, Pause/Resume, Edit, Export CSV, Delete */}
          <div className="flex items-center gap-2 flex-wrap">
            <CheckNowButton monitorId={m.id} />
            <PauseResumeButton monitorId={m.id} isActive={m.is_active} />
            <Link
              href={`/monitors/${m.id}/edit`}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-4 h-4" />
              <span>Ubah</span>
            </Link>
            <a
              href={`/api/monitors/${m.id}/export`}
              download
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              title="Unduh riwayat pengecekan monitor dalam format CSV"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </a>
            <DeleteMonitorDialog monitorId={m.id} monitorName={m.name} />
          </div>
        </div>
      </div>

      {/* Overview Stat Cards (Uptime 24h, 7d, 30d, Rata-rata Latensi, Sisa SSL) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Uptime 24h */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Uptime 24 Jam</p>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {uptime24h !== null ? `${uptime24h}%` : '100%'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{checks24h.length} kali cek</p>
        </div>

        {/* Uptime 7d */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Uptime 7 Hari</p>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {uptime7d !== null ? `${uptime7d}%` : '100%'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{checks7d.length} kali cek</p>
        </div>

        {/* Uptime 30d */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Uptime 30 Hari</p>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {uptime30d !== null ? `${uptime30d}%` : '100%'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{checks30d.length} kali cek</p>
        </div>

        {/* Rata-rata Latensi Respons */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Latensi</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {avgResponseMs !== null ? avgResponseMs : (m.last_response_ms || '-')}
            </span>
            <span className="text-xs text-slate-500 font-mono">ms</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Target status: {m.expected_status}</p>
        </div>

        {/* Sisa Hari SSL */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sertifikat SSL</p>
          <div className="mt-2 font-bold">
            {sslDays !== null ? (
              sslDays > 30 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-base">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>{sslDays} hari lagi</span>
                </span>
              ) : sslDays > 7 ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-base">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{sslDays} hari lagi</span>
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1.5 text-base">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{sslDays <= 0 ? 'Kedaluwarsa' : `${sslDays} hari lagi`}</span>
                </span>
              )
            ) : (
              <span className="text-slate-400 text-sm">Tidak Aktif / HTTP</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">
            {m.ssl_expires_at ? `Exp: ${new Date(m.ssl_expires_at).toLocaleDateString('id-ID')}` : '-'}
          </p>
        </div>
      </div>

      {/* Recharts Area Chart: Response Time */}
      <ResponseChart checks24h={chartPoints24h} checks7d={chartPoints7d} />

      {/* Incident List */}
      <IncidentList incidents={incidents} />

      {/* Riwayat 50 Pengecekan Terakhir */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Riwayat 50 Pengecekan Terakhir</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Log pengujian otomatis status ketersediaan dan latensi HTTP.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Interval: {m.interval_minutes} menit
          </span>
        </div>

        {recent50Checks.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Belum ada riwayat pengecekan untuk monitor ini.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan tombol &quot;Check Now&quot; di atas untuk melakukan tes pertama.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Waktu Check</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">HTTP Code</th>
                  <th className="px-4 py-3">Response Time</th>
                  <th className="px-4 py-3">Sisa SSL</th>
                  <th className="px-4 py-3 rounded-r-xl">Keterangan / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {recent50Checks.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-sans">
                      {new Date(c.checked_at).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.is_up ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          UP
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400">
                          DOWN
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-900 dark:text-white font-bold">
                      {c.status_code || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-900 dark:text-white">
                      {c.response_ms} ms
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-sans">
                      {c.ssl_days_remaining !== null ? `${c.ssl_days_remaining} hari` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 font-sans truncate max-w-xs">
                      {c.error || 'Normal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
