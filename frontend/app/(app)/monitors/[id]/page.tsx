import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Download,
} from 'lucide-react';
import { CheckNowButton } from './check-now-button';
import { PauseResumeButton } from '@/components/pause-resume-button';
import { DeleteMonitorDialog } from '@/components/delete-monitor-dialog';
import { ResponseChart, type ChartCheckPoint } from '@/components/response-chart';
import { IncidentList } from '@/components/incident-list';
import type { Monitor, Check, Incident } from '@statuswatch/backend';
import { calculateUptimePercent, calculateAverageResponseTime, formatSslStatus } from '@statuswatch/backend';

export const dynamic = 'force-dynamic';

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
  const sslInfo = formatSslStatus(sslDays);

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
      {/* Top Header & Actions */}
      <div>
        <Link
          href="/monitors"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Monitor</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {m.name}
              </h1>

              {isPaused ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-unknown))]" />
                  Dijeda
                </span>
              ) : isUp ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))]">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-up))]" />
                  Operasional
                </span>
              ) : isDown ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[hsl(var(--status-down-bg))] text-[hsl(var(--status-down))]">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-down))]" />
                  Gangguan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-unknown))]" />
                  Unknown
                </span>
              )}
            </div>

            <a
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1 font-mono"
            >
              <span>{m.url}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

          {/* Action Buttons: Check Now, Pause/Resume, Edit, Export CSV, Delete */}
          <div className="flex items-center gap-2 flex-wrap">
            <CheckNowButton monitorId={m.id} />
            <PauseResumeButton monitorId={m.id} isActive={m.is_active} />
            <Link
              href={`/monitors/${m.id}/edit`}
              className="h-9 px-3.5 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Ubah</span>
            </Link>
            <a
              href={`/api/monitors/${m.id}/export`}
              download
              className="h-9 px-3.5 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
              title="Unduh CSV riwayat pengecekan"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </a>
            <DeleteMonitorDialog monitorId={m.id} monitorName={m.name} />
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Uptime 24h */}
        <div className="bg-background p-4 rounded-lg border border-border space-y-1">
          <p className="text-xs text-muted-foreground">Uptime 24 Jam</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-foreground">
            {uptime24h !== null ? `${uptime24h}%` : '100%'}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground">{checks24h.length} cek</p>
        </div>

        {/* Uptime 7d */}
        <div className="bg-background p-4 rounded-lg border border-border space-y-1">
          <p className="text-xs text-muted-foreground">Uptime 7 Hari</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-foreground">
            {uptime7d !== null ? `${uptime7d}%` : '100%'}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground">{checks7d.length} cek</p>
        </div>

        {/* Uptime 30d */}
        <div className="bg-background p-4 rounded-lg border border-border space-y-1">
          <p className="text-xs text-muted-foreground">Uptime 30 Hari</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-foreground">
            {uptime30d !== null ? `${uptime30d}%` : '100%'}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground">{checks30d.length} cek</p>
        </div>

        {/* Rata-rata Latensi Respons */}
        <div className="bg-background p-4 rounded-lg border border-border space-y-1">
          <p className="text-xs text-muted-foreground">Rata-rata Latensi</p>
          <p className="text-2xl font-semibold font-mono tabular-nums text-foreground">
            {avgResponseMs !== null ? `${avgResponseMs} ms` : m.last_response_ms !== null ? `${m.last_response_ms} ms` : '-'}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground">Target {m.expected_status}</p>
        </div>

        {/* Sisa Hari SSL */}
        <div className="bg-background p-4 rounded-lg border border-border space-y-1 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Sertifikat SSL</p>
          <p className="text-2xl font-semibold font-mono tabular-nums">
            {sslInfo.level === 'safe' && (
              <span className="text-[hsl(var(--status-up))]">{sslInfo.label}</span>
            )}
            {sslInfo.level === 'warning' && (
              <span className="text-[hsl(var(--status-warn))]">{sslInfo.label}</span>
            )}
            {(sslInfo.level === 'danger' || sslInfo.level === 'expired') && (
              <span className="text-[hsl(var(--status-down))]">{sslInfo.label}</span>
            )}
            {sslInfo.level === 'none' && (
              <span className="text-muted-foreground">-</span>
            )}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground truncate">
            {m.ssl_expires_at ? `Exp: ${new Date(m.ssl_expires_at).toLocaleDateString('id-ID')}` : '-'}
          </p>
        </div>
      </div>

      {/* Response Chart */}
      <ResponseChart checks24h={chartPoints24h} checks7d={chartPoints7d} />

      {/* Incident List */}
      <IncidentList incidents={incidents} />

      {/* Riwayat 50 Pengecekan Terakhir */}
      <div className="bg-background border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Riwayat 50 Pengecekan Terakhir
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Log pengujian otomatis status ketersediaan dan latensi HTTP.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Interval: {m.interval_minutes} mnt
          </span>
        </div>

        {recent50Checks.length === 0 ? (
          <div className="text-center py-8 border border-border rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Belum ada riwayat pengecekan untuk monitor ini.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
                  <th className="py-2.5 px-4 font-normal">Waktu (WIB)</th>
                  <th className="py-2.5 px-3 font-normal">Status</th>
                  <th className="py-2.5 px-3 font-normal text-right">HTTP Code</th>
                  <th className="py-2.5 px-3 font-normal text-right">Response Time</th>
                  <th className="py-2.5 px-3 font-normal text-right">SSL</th>
                  <th className="py-2.5 px-4 font-normal text-right">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent50Checks.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40 transition-colors h-11">
                    <td className="py-2 px-4 font-mono text-muted-foreground whitespace-nowrap">
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
                    <td className="py-2 px-3 whitespace-nowrap">
                      {c.is_up ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--status-up))]" />
                          UP
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-down-bg))] text-[hsl(var(--status-down))]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--status-down))]" />
                          DOWN
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-foreground">
                      {c.status_code || '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-foreground">
                      {c.response_ms} ms
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                      {c.ssl_days_remaining !== null ? `${c.ssl_days_remaining} hari` : '-'}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-muted-foreground truncate max-w-xs">
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
