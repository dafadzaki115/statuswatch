import type { Incident } from '@statuswatch/backend';
import { formatDurationSeconds } from '@statuswatch/backend';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface IncidentListProps {
  incidents: Incident[];
}

export function IncidentList({ incidents }: IncidentListProps) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          Daftar Insiden
        </h2>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Tidak ada insiden tercatat
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Layanan terpantau beroperasi stabil tanpa gangguan akses atau kegagalan beruntun.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <span>Daftar Insiden ({incidents.length})</span>
        </h2>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {incidents.map((inc) => {
          const isOpen = inc.status === 'open';
          const startTime = new Date(inc.started_at);
          const endTime = inc.resolved_at ? new Date(inc.resolved_at) : null;
          const durationSeconds = endTime
            ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
            : Math.round((Date.now() - startTime.getTime()) / 1000);

          return (
            <div key={inc.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {isOpen ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      SEDANG TERJADI
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      TERSELESAIKAN
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {inc.title}
                  </h3>
                </div>

                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Durasi: <strong className="text-slate-700 dark:text-slate-300">{formatDurationSeconds(durationSeconds)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div>
                  <span className="text-slate-400">Waktu Mulai:</span>{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {startTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Waktu Selesai:</span>{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {endTime
                      ? `${endTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`
                      : 'Masih berlangsung'}
                  </span>
                </div>
              </div>

              {inc.last_error && (
                <div className="bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl px-3 py-2 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono">{inc.last_error}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
