import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight,
  Check,
  Server,
  Clock,
  Radio,
  Calendar,
  Lock,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Status<span className="text-emerald-600 dark:text-emerald-400">Watch</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>Daftar Gratis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 space-y-24 py-16 sm:py-24">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mx-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Uptime & SSL Monitor Otomatis Berbasis Cloud</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Tahu duluan sebelum{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
              pelanggan Anda tahu.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Pantau ketersediaan situs web, kecepatan respons HTTP, dan masa berlaku sertifikat SSL dari cloud tanpa instalasi server apa pun.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href={user ? '/dashboard' : '/register'}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{user ? 'Menuju ke Dashboard' : 'Mulai Sekarang — Gratis'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/status/demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Lihat Contoh Status Page Demo</span>
            </Link>
          </div>
        </section>

        {/* 3 Core Features Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Tiga Pilar Pemantauan Komprehensif
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Dirancang untuk developer solo, instansi, dan UMKM yang membutuhkan kepastian ketersediaan layanan digital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Uptime */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pengecekan HTTP & Latensi
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Pengecekan berkala otomatis setiap 5 hingga 60 menit. Dilengkapi state machine cerdas dengan verifikasi dua kegagalan beruntun untuk meminimalisir false positive.
              </p>
            </div>

            {/* Feature 2: SSL */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pemantauan Sertifikat SSL
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Inspeksi berkala pada port 443 TLS. Menghitung sisa hari berlaku sertifikat SSL dan memberi peringatan dini sebelum browser menampilkan peringatan bahaya kepada pengunjung.
              </p>
            </div>

            {/* Feature 3: Status Page */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Halaman Status Publik
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Tampilkan transparansi operasional kepada pengguna melalui URL publik dengan visualisasi bar uptime 90 hari, banner status agregat, dan log insiden 14 hari terakhir.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Comparison Table (Free vs Pro) */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Paket Langganan Transparan
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Mulai gratis dengan paket Free, atau upgrade ke paket Pro kapan saja secara instan.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                    <th className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">
                      Fitur & Batasan Kuota
                    </th>
                    <th className="py-4 px-6 font-bold text-slate-900 dark:text-white text-center w-40">
                      Free (Rp 0)
                    </th>
                    <th className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400 text-center w-48 bg-emerald-50/50 dark:bg-emerald-950/30">
                      Pro (Simulasi)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Jumlah Monitor Maksimal</span>
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold font-mono">3 monitor</td>
                    <td className="py-3.5 px-6 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                      20 monitor
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Interval Pengecekan Minimum</span>
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold font-mono">10 menit</td>
                    <td className="py-3.5 px-6 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                      5 menit
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Halaman Status Publik</span>
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold font-mono">1 status page</td>
                    <td className="py-3.5 px-6 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                      5 status page
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Retensi Riwayat Pemeriksaan</span>
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold font-mono">7 hari</td>
                    <td className="py-3.5 px-6 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                      30 hari
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Inspeksi Masa Berlaku SSL/TLS</span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    </td>
                    <td className="py-3.5 px-6 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Proteksi SSRF Jaringan Privat</span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    </td>
                    <td className="py-3.5 px-6 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Peralihan paket dapat disimulasikan kapan saja tanpa kartu kredit melalui menu Pengaturan.
              </p>
              <Link
                href={user ? '/dashboard' : '/register'}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors whitespace-nowrap"
              >
                {user ? 'Buka Dashboard' : 'Mulai Akun Gratis'}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800 dark:text-slate-200">StatusWatch</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <p>
            Mata Kuliah Cloud Computing — Arsitektur SaaS Serverless (Vercel + Supabase + GitHub Actions)
          </p>
        </div>
      </footer>
    </div>
  );
}
