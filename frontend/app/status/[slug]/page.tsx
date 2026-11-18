import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin, StatusPageService, AppError } from '@statuswatch/backend';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { UptimeBar } from '@/components/uptime-bar';
import { ThemeToggle } from '@/components/theme-toggle';
import { formatDurationSeconds } from '@statuswatch/backend';

export const revalidate = 30;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const service = new StatusPageService(supabaseAdmin);
    const data = await service.getPublicStatusPageData(slug);

    return {
      title: `${data.title} — Status Layanan`,
      description: data.description || `Halaman status resmi pemantauan ketersediaan sistem ${data.title}.`,
      openGraph: {
        title: `${data.title} — Status Layanan`,
        description: data.description || `Status operasional dan uptime terkini ${data.title}.`,
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Status Layanan — StatusWatch',
    };
  }
}

export default async function PublicStatusPage({ params }: Props) {
  const { slug } = await params;

  let pageData;
  try {
    const service = new StatusPageService(supabaseAdmin);
    pageData = await service.getPublicStatusPageData(slug);
  } catch (err: unknown) {
    if (err instanceof AppError && err.statusCode === 404) {
      notFound();
    }
    console.error('Error fetching public status page:', err);
    notFound();
  }

  const {
    title,
    description,
    aggregateStatus,
    aggregateLabel,
    monitors,
    activeIncidents,
    pastIncidents,
  } = pageData;

  const isOperational = aggregateStatus === 'operational';
  const isDegraded = aggregateStatus === 'degraded';

  return (
    <div className="min-h-screen bg-background text-foreground antialiased flex flex-col justify-between">
      {/* Top Banner Status Agregat */}
      <div>
        <header
          className={`py-5 px-4 sm:px-6 border-b transition-colors ${
            isOperational
              ? 'bg-[hsl(var(--status-up-bg))] border-[hsl(var(--status-up))] text-[hsl(var(--status-up))]'
              : isDegraded
              ? 'bg-[hsl(var(--status-warn-bg))] border-[hsl(var(--status-warn))] text-[hsl(var(--status-warn))]'
              : 'bg-[hsl(var(--status-down-bg))] border-[hsl(var(--status-down))] text-[hsl(var(--status-down))]'
          }`}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isOperational ? (
                <CheckCircle className="w-6 h-6 shrink-0" />
              ) : isDegraded ? (
                <AlertTriangle className="w-6 h-6 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 shrink-0" />
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                  {aggregateLabel}
                </h1>
                <p className="text-xs opacity-90">
                  {isOperational
                    ? 'Seluruh sistem dan layanan terpantau berfungsi normal.'
                    : isDegraded
                    ? 'Sebagian layanan mengalami kendala atau latensi tinggi.'
                    : 'Terjadi gangguan menyeluruh pada sebagian besar layanan.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono border border-current px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span>Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
          {/* Header Info Halaman */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {/* Insiden Aktif (Bila Ada) */}
          {activeIncidents.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[hsl(var(--status-down))]" />
                <span>Insiden Aktif</span>
              </h3>

              <div className="space-y-2">
                {activeIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 rounded-lg bg-[hsl(var(--status-down-bg))] border border-[hsl(var(--status-down))] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-[hsl(var(--status-down))] text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        GANGGUAN AKTIF
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {new Date(inc.started_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {inc.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Tim teknis sedang memantau dan memulihkan akses layanan secepat mungkin.
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Daftar Layanan & Uptime */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span>Status Layanan & Riwayat Uptime (90 Hari)</span>
              </h3>
            </div>

            {monitors.length === 0 ? (
              <div className="p-8 text-center bg-background rounded-lg border border-border text-xs text-muted-foreground">
                Belum ada monitor layanan yang ditautkan ke halaman status ini.
              </div>
            ) : (
              <div className="space-y-3">
                {monitors.map((mon) => {
                  const monIsUp = mon.current_status === 'up';
                  const monIsDown = mon.current_status === 'down';

                  return (
                    <div
                      key={mon.id}
                      className="p-4 bg-background rounded-lg border border-border space-y-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-semibold text-foreground">
                            {mon.name}
                          </h4>
                          {mon.last_response_ms !== null && (
                            <p className="text-[11px] text-muted-foreground font-mono">
                              Latensi: {mon.last_response_ms} ms
                            </p>
                          )}
                        </div>

                        {monIsUp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))]">
                            <CheckCircle className="w-3 h-3" />
                            <span>OPERASIONAL</span>
                          </span>
                        ) : monIsDown ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-down-bg))] text-[hsl(var(--status-down))]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>GANGGUAN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                            <span>MENUNGGU DATA</span>
                          </span>
                        )}
                      </div>

                      {/* 90 Days Uptime Bar */}
                      <UptimeBar segments={mon.dailySegments} uptimePercent={mon.uptimePercent} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Riwayat Insiden 14 Hari Terakhir */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Riwayat Insiden (14 Hari Terakhir)</span>
            </h3>

            {pastIncidents.length === 0 ? (
              <div className="p-6 bg-background rounded-lg border border-border text-center">
                <CheckCircle2 className="w-6 h-6 text-[hsl(var(--status-up))] mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">
                  Tidak ada insiden tercatat dalam 14 hari terakhir.
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Seluruh layanan beroperasi dengan keandalan penuh.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastIncidents.map((inc) => {
                  const startTime = new Date(inc.started_at);
                  const endTime = inc.resolved_at ? new Date(inc.resolved_at) : null;
                  const durSec = endTime
                    ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
                    : null;

                  return (
                    <div
                      key={inc.id}
                      className="p-4 bg-background rounded-lg border border-border space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>TERSELESAIKAN</span>
                        </span>
                        {durSec !== null && (
                          <span className="text-xs text-muted-foreground font-mono">
                            Durasi: {formatDurationSeconds(durSec)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-foreground">
                        {inc.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {startTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                        {endTime && ` hingga ${endTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-background">
        <p>
          Powered by <strong className="text-foreground font-semibold">StatusWatch</strong> — Cloud Uptime & SSL Monitor
        </p>
      </footer>
    </div>
  );
}
