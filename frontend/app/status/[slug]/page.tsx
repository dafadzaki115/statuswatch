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
    // Gunakan service role hanya di server setelah validasi slug dan is_public = true (PRD FR-10)
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white antialiased flex flex-col justify-between">
      {/* Top Banner Status Agregat */}
      <div>
        <header
          className={`py-6 px-4 sm:px-6 shadow-sm border-b transition-colors ${
            isOperational
              ? 'bg-emerald-600 border-emerald-700 text-white'
              : isDegraded
              ? 'bg-amber-500 border-amber-600 text-white'
              : 'bg-red-600 border-red-700 text-white'
          }`}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isOperational ? (
                <CheckCircle className="w-8 h-8 shrink-0 text-white" />
              ) : isDegraded ? (
                <AlertTriangle className="w-8 h-8 shrink-0 text-white" />
              ) : (
                <XCircle className="w-8 h-8 shrink-0 text-white" />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {aggregateLabel}
                </h1>
                <p className="text-xs sm:text-sm text-white/90">
                  {isOperational
                    ? 'Seluruh sistem dan layanan terpantau berfungsi normal.'
                    : isDegraded
                    ? 'Sebagian layanan mengalami kendala atau latensi tinggi.'
                    : 'Terjadi gangguan menyeluruh pada sebagian besar layanan.'}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Real-time</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
          {/* Header Info Halaman */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {/* Insiden Aktif (Bila Ada) */}
          {activeIncidents.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                <span>Insiden Aktif</span>
              </h3>

              <div className="space-y-3">
                {activeIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        GANGGUAN AKTIF
                      </span>
                      <span className="text-xs font-medium text-red-700 dark:text-red-300">
                        Dimulai: {new Date(inc.started_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-red-900 dark:text-red-200">
                      {inc.title}
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Tim teknis sedang memantau dan memulihkan akses layanan secepat mungkin.
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Daftar Layanan & Uptime 90 Hari */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>Status Layanan & Riwayat Uptime (90 Hari)</span>
              </h3>
            </div>

            {monitors.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm text-slate-500">
                Belum ada monitor layanan yang ditautkan ke halaman status ini.
              </div>
            ) : (
              <div className="space-y-4">
                {monitors.map((mon) => {
                  const monIsUp = mon.current_status === 'up';
                  const monIsDown = mon.current_status === 'down';

                  return (
                    <div
                      key={mon.id}
                      className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {mon.name}
                          </h4>
                          {mon.last_response_ms !== null && (
                            <p className="text-xs text-slate-400 font-mono">
                              Latensi saat ini: {mon.last_response_ms} ms
                            </p>
                          )}
                        </div>

                        {monIsUp ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>OPERASIONAL</span>
                          </span>
                        ) : monIsDown ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            <span>GANGGUAN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
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
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              <span>Riwayat Insiden (14 Hari Terakhir)</span>
            </h3>

            {pastIncidents.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Tidak ada insiden tercatat dalam 14 hari terakhir.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Seluruh layanan beroperasi dengan keandalan penuh.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastIncidents.map((inc) => {
                  const startTime = new Date(inc.started_at);
                  const endTime = inc.resolved_at ? new Date(inc.resolved_at) : null;
                  const durSec = endTime
                    ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
                    : null;

                  return (
                    <div
                      key={inc.id}
                      className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>TERSELESAIKAN</span>
                        </span>
                        {durSec !== null && (
                          <span className="text-xs text-slate-400 font-mono">
                            Durasi: {formatDurationSeconds(durSec)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {inc.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Terjadi pada {startTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
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
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
        <p>
          Powered by <strong className="text-emerald-600 dark:text-emerald-400 font-bold">StatusWatch</strong> — Cloud Uptime & SSL Monitor
        </p>
      </footer>
    </div>
  );
}
