import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Server,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Plus,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { MonitorList, type MonitorItemWithUptime } from '@/components/monitor-list';
import { calculateUptimePercent } from '@statuswatch/backend';

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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Monitor
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pantau status ketersediaan dan SSL seluruh situs web Anda secara terpusat.
          </p>
        </div>

        {canAddMore ? (
          <Link
            href="/monitors/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Monitor</span>
          </Link>
        ) : (
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-colors"
          >
            <span>Batas Kuota ({maxLimit}) Tercapai — Upgrade Pro</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monitor */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Monitor
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalMonitors}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Kuota {totalMonitors}/{maxLimit} digunakan
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Server className="w-6 h-6" />
          </div>
        </div>

        {/* Up Monitor */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Operasional (Up)
            </p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {upMonitors}
            </p>
            <p className="mt-1 text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
              Berjalan normal
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Down Monitor */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Gangguan (Down)
            </p>
            <p className="mt-2 text-3xl font-extrabold text-red-600 dark:text-red-400">
              {downMonitors}
            </p>
            <p className="mt-1 text-[11px] text-red-600/80 dark:text-red-400/80">
              {downMonitors > 0 ? 'Perlu tindakan' : 'Tidak ada gangguan'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* SSL Segera Habis */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              SSL Segera Habis
            </p>
            <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {sslExpiringSoon}
            </p>
            <p className="mt-1 text-[11px] text-amber-600/80 dark:text-amber-400/80">
              Masa berlaku &le; 30 hari
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content: Monitor List with Search and Filter or Empty State */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Daftar Layanan Dipantau
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {monitorsWithUptime.length} situs terdaftar
          </span>
        </div>

        <MonitorList monitors={monitorsWithUptime} canAddMore={canAddMore} />
      </div>

      {/* Account Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Status Akun & Paket Langganan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Terdaftar sebagai <span className="font-medium text-slate-700 dark:text-slate-300">{profile?.email}</span> pada paket{' '}
              <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">{plan}</span> (Maksimal {maxLimit} monitor).
            </p>
          </div>
        </div>

        <Link
          href="/settings"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
        >
          <span>Kelola Paket</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
