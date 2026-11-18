import type { Incident } from '@statuswatch/backend';
import { formatDurationSeconds } from '@statuswatch/backend';
import { AlertCircle } from 'lucide-react';

interface IncidentListProps {
  incidents: Incident[];
}

export function IncidentList({ incidents }: IncidentListProps) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="bg-background border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Daftar Insiden
        </h2>
        <p className="text-xs text-muted-foreground">
          Tidak ada insiden tercatat. Seluruh target pemantauan terpantau stabil.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Daftar Insiden ({incidents.length})
        </h2>
      </div>

      <div className="divide-y divide-border">
        {incidents.map((inc) => {
          const isOpen = inc.status === 'open';
          const startTime = new Date(inc.started_at);
          const endTime = inc.resolved_at ? new Date(inc.resolved_at) : null;
          const durationSeconds = endTime
            ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
            : Math.round((Date.now() - startTime.getTime()) / 1000);

          return (
            <div key={inc.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-down-bg))] text-[hsl(var(--status-down))]">
                      <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-down))]" />
                      Sedang Terjadi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))]">
                      <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-up))]" />
                      Selesai
                    </span>
                  )}
                  <h3 className="text-xs font-semibold text-foreground">
                    {inc.title}
                  </h3>
                </div>

                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  Durasi: <strong className="text-foreground">{formatDurationSeconds(durationSeconds)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-0.5">
                <div>
                  <span>Waktu Mulai:</span>{' '}
                  <span className="font-mono text-foreground">
                    {startTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                  </span>
                </div>
                <div>
                  <span>Waktu Selesai:</span>{' '}
                  <span className="font-mono text-foreground">
                    {endTime
                      ? `${endTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`
                      : 'Masih berlangsung'}
                  </span>
                </div>
              </div>

              {inc.last_error && (
                <div className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-[hsl(var(--status-down))] flex items-center gap-2">
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
