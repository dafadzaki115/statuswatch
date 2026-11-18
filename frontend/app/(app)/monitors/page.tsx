import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Plus, ArrowUpRight } from 'lucide-react';
import { MonitorList, type MonitorItemWithUptime } from '@/components/monitor-list';
import { calculateUptimePercent } from '@statuswatch/backend';

export default async function MonitorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ambil profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const plan = profile?.plan || 'free';
  const maxLimit = plan === 'pro' ? 20 : 3;

  // Ambil daftar monitor
  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const rawMonitors = monitors || [];
  const now = new Date();
  const past24hIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const monitorIds = rawMonitors.map((m) => m.id);

  // Ambil checks 24 jam terakhir
  const checksByMonitor = new Map<string, { is_up: boolean }[]>();
  if (monitorIds.length > 0) {
    const { data: checks24h } = await supabase
      .from('checks')
      .select('monitor_id, is_up')
      .in('monitor_id', monitorIds)
      .gte('checked_at', past24hIso);

    if (checks24h) {
      for (const c of checks24h) {
        const arr = checksByMonitor.get(c.monitor_id) || [];
        arr.push(c);
        checksByMonitor.set(c.monitor_id, arr);
      }
    }
  }

  const monitorsWithUptime: MonitorItemWithUptime[] = rawMonitors.map((m) => {
    const checks = checksByMonitor.get(m.id) || [];
    const uptime = calculateUptimePercent(checks);

    let sslDays: number | null = null;
    if (m.ssl_expires_at) {
      const msRemaining = new Date(m.ssl_expires_at).getTime() - now.getTime();
      sslDays = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
    }

    return {
      id: m.id,
      name: m.name,
      url: m.url,
      method: m.method || 'GET',
      interval_minutes: m.interval_minutes || 5,
      is_active: m.is_active,
      current_status: m.current_status,
      last_checked_at: m.last_checked_at,
      last_response_ms: m.last_response_ms,
      last_status_code: m.last_status_code,
      ssl_expires_at: m.ssl_expires_at,
      uptime24h: uptime,
      sslDaysRemaining: sslDays,
    };
  });

  const canAddMore = rawMonitors.length < maxLimit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daftar Monitor
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kelola target situs dan API yang dipantau ({rawMonitors.length}/{maxLimit} digunakan).
          </p>
        </div>

        {canAddMore ? (
          <Link
            href="/monitors/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Monitor</span>
          </Link>
        ) : (
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-colors"
          >
            <span>Batas Kuota Tercapai ({maxLimit}) — Upgrade ke Pro</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Monitor List Component with Search and Filter */}
      <MonitorList monitors={monitorsWithUptime} canAddMore={canAddMore} />
    </div>
  );
}
