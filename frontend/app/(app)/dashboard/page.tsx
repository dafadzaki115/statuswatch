import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Plus, ArrowUpRight } from 'lucide-react';
import { MonitorList, type MonitorItemWithUptime } from '@/components/monitor-list';
import { calculateUptimePercent } from '@statuswatch/backend';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Ambil profil user
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const plan = profile?.plan || 'free';
  const maxLimit = plan === 'pro' ? 20 : 3;

  // 2. Ambil seluruh monitor milik user
  const { data: monitorsData } = await supabase
    .from('monitors')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const rawMonitors = monitorsData || [];
  const totalMonitors = rawMonitors.length;
  const upMonitors = rawMonitors.filter((m) => m.is_active && m.current_status === 'up').length;
  const downMonitors = rawMonitors.filter((m) => m.is_active && m.current_status === 'down').length;

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // SSL segera habis: berlaku tapi <= 30 hari lagi, atau sudah expired
  const sslExpiringSoon = rawMonitors.filter((m) => {
    if (!m.ssl_expires_at) return false;
    const exp = new Date(m.ssl_expires_at);
    return exp <= thirtyDaysLater;
  }).length;

  // 3. Ambil riwayat check 24 jam terakhir untuk semua monitor user
  const past24hIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const monitorIds = rawMonitors.map((m) => m.id);

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

  // Format data untuk MonitorList
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

  const canAddMore = totalMonitors < maxLimit;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ringkasan ketersediaan dan status seluruh target pemantauan.
          </p>
        </div>

        <div>
          {canAddMore ? (
            <Link
              href="/monitors/new"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Monitor</span>
            </Link>
          ) : (
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors"
            >
              <span>Batas Kuota ({maxLimit}) Tercapai — Kelola Paket</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Monitor */}
        <div className="bg-background p-4 rounded-lg border border-border space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Total Monitor
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-foreground">
              {totalMonitors}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {totalMonitors}/{maxLimit} kuota
            </span>
          </div>
        </div>

        {/* Up Monitor */}
        <div className="bg-background p-4 rounded-lg border border-border space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-up))]" />
            <p className="text-xs font-medium text-muted-foreground">
              Operasional
            </p>
          </div>
          <p className="text-2xl font-semibold font-mono tabular-nums text-foreground">
            {upMonitors}
          </p>
        </div>

        {/* Down Monitor */}
        <div className="bg-background p-4 rounded-lg border border-border space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-down))]" />
            <p className="text-xs font-medium text-muted-foreground">
              Gangguan
            </p>
          </div>
          <p className="text-2xl font-semibold font-mono tabular-nums text-foreground">
            {downMonitors}
          </p>
        </div>

        {/* SSL Segera Habis */}
        <div className="bg-background p-4 rounded-lg border border-border space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-warn))]" />
            <p className="text-xs font-medium text-muted-foreground">
              SSL &le; 30 Hari
            </p>
          </div>
          <p className="text-2xl font-semibold font-mono tabular-nums text-foreground">
            {sslExpiringSoon}
          </p>
        </div>
      </div>

      {/* Main Content: Monitor List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Daftar Monitor
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {monitorsWithUptime.length} terdaftar
          </span>
        </div>

        <MonitorList monitors={monitorsWithUptime} canAddMore={canAddMore} />
      </div>
    </div>
  );
}
