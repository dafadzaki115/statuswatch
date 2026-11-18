'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { formatSslStatus } from '@statuswatch/backend/lib/uptime';

export interface MonitorItemWithUptime {
  id: string;
  name: string;
  url: string;
  method: string;
  interval_minutes: number;
  is_active: boolean;
  current_status: 'up' | 'down' | 'unknown';
  last_checked_at: string | null;
  last_response_ms: number | null;
  last_status_code: number | null;
  ssl_expires_at: string | null;
  uptime24h: number | null;
  sslDaysRemaining: number | null;
}

interface MonitorListProps {
  monitors: MonitorItemWithUptime[];
  canAddMore?: boolean;
}

export function MonitorList({ monitors, canAddMore = true }: MonitorListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down' | 'paused'>('all');

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return 'Belum dicek';
    const diffSeconds = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSeconds < 60) return `${Math.max(1, diffSeconds)} dtk lalu`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  };

  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.url.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'paused') return !m.is_active;
      if (statusFilter === 'up') return m.is_active && m.current_status === 'up';
      if (statusFilter === 'down') return m.is_active && m.current_status === 'down';

      return true;
    });
  }, [monitors, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau URL..."
            className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            Semua ({monitors.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('up')}
            className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === 'up'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            Up ({monitors.filter((m) => m.is_active && m.current_status === 'up').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('down')}
            className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === 'down'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            Down ({monitors.filter((m) => m.is_active && m.current_status === 'down').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paused')}
            className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === 'paused'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            Dijeda ({monitors.filter((m) => !m.is_active).length})
          </button>
        </div>
      </div>

      {/* List Output */}
      {filteredMonitors.length === 0 ? (
        <div className="bg-background border border-border rounded-lg p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {monitors.length === 0
              ? 'Belum ada monitor. Tambahkan URL pertamamu.'
              : 'Tidak ada monitor yang cocok dengan kriteria pencarian atau filter.'}
          </p>
          {canAddMore && (
            <div>
              <Link
                href="/monitors/new"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Monitor</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border border-border rounded-lg overflow-hidden bg-background">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
                  <th className="py-2.5 px-4 font-normal">Nama & Target</th>
                  <th className="py-2.5 px-3 font-normal">Status</th>
                  <th className="py-2.5 px-3 font-normal text-right">Latensi</th>
                  <th className="py-2.5 px-3 font-normal text-right">Uptime 24j</th>
                  <th className="py-2.5 px-3 font-normal text-right">SSL</th>
                  <th className="py-2.5 px-3 font-normal text-right">Check Terakhir</th>
                  <th className="py-2.5 px-4 font-normal text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMonitors.map((m) => {
                  const isPaused = !m.is_active;
                  const isUp = m.current_status === 'up';
                  const isDown = m.current_status === 'down';
                  const sslInfo = formatSslStatus(m.sslDaysRemaining);

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-muted/40 transition-colors h-12"
                    >
                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="space-y-0.5 truncate">
                          <Link
                            href={`/monitors/${m.id}`}
                            className="font-medium text-foreground hover:underline truncate block"
                          >
                            {m.name}
                          </Link>
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] font-mono truncate max-w-full"
                          >
                            <span className="truncate">{m.url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                          </a>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isPaused ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-unknown))]" />
                            Dijeda
                          </span>
                        ) : isUp ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))]">
                            <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-up))]" />
                            Up
                          </span>
                        ) : isDown ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-down-bg))] text-[hsl(var(--status-down))]">
                            <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-down))]" />
                            Down
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-unknown))]" />
                            Unknown
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                        {m.last_response_ms !== null ? `${m.last_response_ms} ms` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                        {m.uptime24h !== null ? `${m.uptime24h}%` : '100%'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {sslInfo.level === 'safe' && (
                          <span className="text-[hsl(var(--status-up))]">{sslInfo.label}</span>
                        )}
                        {sslInfo.level === 'warning' && (
                          <span className="text-[hsl(var(--status-warn))]">{sslInfo.label}</span>
                        )}
                        {(sslInfo.level === 'danger' || sslInfo.level === 'expired') && (
                          <span className="text-[hsl(var(--status-down))] font-semibold">
                            {sslInfo.label}
                          </span>
                        )}
                        {sslInfo.level === 'none' && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(m.last_checked_at)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          href={`/monitors/${m.id}`}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-border text-xs text-foreground hover:bg-muted transition-colors"
                        >
                          <span>Detail</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Compact List View */}
          <div className="md:hidden divide-y divide-border border border-border rounded-lg bg-background overflow-hidden">
            {filteredMonitors.map((m) => {
              const isPaused = !m.is_active;
              const isUp = m.current_status === 'up';
              const isDown = m.current_status === 'down';
              const sslInfo = formatSslStatus(m.sslDaysRemaining);

              return (
                <div key={m.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/monitors/${m.id}`}
                      className="font-medium text-sm text-foreground hover:underline truncate"
                    >
                      {m.name}
                    </Link>
                    {isPaused ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-unknown))]" />
                        Dijeda
                      </span>
                    ) : isUp ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))] shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-up))]" />
                        Up
                      </span>
                    ) : isDown ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-down-bg))] text-[hsl(var(--status-down))] shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-down))]" />
                        Down
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-unknown))]" />
                        Unknown
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-muted-foreground truncate">
                    {m.url}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Latensi</span>
                      <span className="font-mono tabular-nums text-foreground">
                        {m.last_response_ms !== null ? `${m.last_response_ms} ms` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Uptime</span>
                      <span className="font-mono tabular-nums text-foreground">
                        {m.uptime24h !== null ? `${m.uptime24h}%` : '100%'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block">SSL</span>
                      <span className="font-mono tabular-nums">
                        {sslInfo.level === 'safe' && (
                          <span className="text-[hsl(var(--status-up))]">{sslInfo.label}</span>
                        )}
                        {sslInfo.level === 'warning' && (
                          <span className="text-[hsl(var(--status-warn))]">{sslInfo.label}</span>
                        )}
                        {(sslInfo.level === 'danger' || sslInfo.level === 'expired') && (
                          <span className="text-[hsl(var(--status-down))] font-semibold">
                            {sslInfo.label}
                          </span>
                        )}
                        {sslInfo.level === 'none' && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{formatRelativeTime(m.last_checked_at)}</span>
                    <Link
                      href={`/monitors/${m.id}`}
                      className="inline-flex items-center gap-1 text-foreground font-medium hover:underline"
                    >
                      <span>Lihat detail</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
