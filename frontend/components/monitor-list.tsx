'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  PauseCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  Plus,
} from 'lucide-react';

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

  // Format waktu relatif (misal: "2 menit lalu")
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
      // 1. Filter nama
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.url.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Filter status
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama monitor atau URL..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Semua ({monitors.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('up')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'up'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            Up ({monitors.filter((m) => m.is_active && m.current_status === 'up').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('down')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'down'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
            }`}
          >
            Down ({monitors.filter((m) => m.is_active && m.current_status === 'down').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'paused'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            Dijeda ({monitors.filter((m) => !m.is_active).length})
          </button>
        </div>
      </div>

      {/* List Output */}
      {filteredMonitors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tidak ada monitor yang cocok dengan kriteria pencarian atau filter.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Coba sesuaikan kata kunci pencarian atau ganti filter status di atas.
          </p>
          {canAddMore && (
            <div className="mt-4">
              <Link
                href="/monitors/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Monitor Baru</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredMonitors.map((m) => {
            const isPaused = !m.is_active;
            const isUp = m.current_status === 'up';
            const isDown = m.current_status === 'down';

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/50 transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Monitor Name & URL */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link
                        href={`/monitors/${m.id}`}
                        className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate"
                      >
                        {m.name}
                      </Link>

                      {isPaused ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <PauseCircle className="w-3 h-3 text-slate-500" />
                          <span>Dijeda</span>
                        </span>
                      ) : isUp ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span>Operasional (UP)</span>
                        </span>
                      ) : isDown ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200/60 dark:border-red-800/40">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span>Gangguan (DOWN)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <HelpCircle className="w-3 h-3" />
                          <span>Belum Dicek</span>
                        </span>
                      )}
                    </div>

                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <span className="truncate">{m.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  {/* Middle: Metrics (Response Time, Uptime 24h, SSL, Last Check) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6 py-2 lg:py-0 border-y lg:border-y-0 border-slate-100 dark:border-slate-800 text-xs">
                    {/* Latensi */}
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium">Response Time</p>
                      <p className="mt-0.5 font-bold text-slate-900 dark:text-white font-mono">
                        {m.last_response_ms !== null ? `${m.last_response_ms} ms` : '-'}
                      </p>
                    </div>

                    {/* Uptime 24 Jam */}
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium">Uptime 24j</p>
                      <p className="mt-0.5 font-bold text-slate-900 dark:text-white font-mono">
                        {m.uptime24h !== null ? `${m.uptime24h}%` : '100%'}
                      </p>
                    </div>

                    {/* SSL Days Remaining */}
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium">Sertifikat SSL</p>
                      <p className="mt-0.5 font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        {m.sslDaysRemaining !== null ? (
                          m.sslDaysRemaining > 30 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{m.sslDaysRemaining} hari</span>
                            </span>
                          ) : m.sslDaysRemaining > 7 ? (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>{m.sslDaysRemaining} hari</span>
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>{m.sslDaysRemaining <= 0 ? 'Expired' : `${m.sslDaysRemaining} hari`}</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </p>
                    </div>

                    {/* Last Checked */}
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium">Check Terakhir</p>
                      <p className="mt-0.5 font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatRelativeTime(m.last_checked_at)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/monitors/${m.id}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      <span>Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
