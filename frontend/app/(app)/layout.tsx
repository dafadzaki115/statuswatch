import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '../(auth)/actions';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Activity,
  LayoutDashboard,
  Server,
  Radio,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Validasi keamanan server: gunakan getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ambil data profil pengguna untuk menampilkan paket
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email')
    .eq('id', user.id)
    .single();

  const planName = (profile?.plan || 'free').toUpperCase();
  const userEmail = profile?.email || user.email || 'Pengguna';

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col">
      {/* Top Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Status indicator */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                    Status<span className="text-emerald-600 dark:text-emerald-400">Watch</span>
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/monitors"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-2"
                >
                  <Server className="w-4 h-4" />
                  <span>Monitor</span>
                </Link>
                <Link
                  href="/status-pages"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>Status Page</span>
                </Link>
                <Link
                  href="/settings"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Pengaturan</span>
                </Link>
              </nav>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 text-xs border border-slate-200/60 dark:border-slate-700/60">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                  {userEmail}
                </span>
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase">
                  {planName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    title="Keluar dari akun"
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1.5 text-xs font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
