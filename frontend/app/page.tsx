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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-foreground selection:text-background">
      {/* Top Navbar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-muted text-foreground flex items-center justify-center border border-border">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">
              Status<span className="text-muted-foreground">Watch</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {user ? (
              <Link
                href="/dashboard"
                className="h-8 px-3 rounded-lg text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 shadow-xs transition-opacity flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="h-8 px-2.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="h-8 px-3 rounded-lg text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 shadow-xs transition-opacity flex items-center gap-1.5"
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
      <main className="flex-1 space-y-20 py-12 sm:py-20">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[11px] font-mono text-muted-foreground mx-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--status-up))] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--status-up))]"></span>
            </span>
            <span>Uptime & SSL Monitor Otomatis Berbasis Cloud</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Tahu kendala sistem sebelum{' '}
            <span className="text-muted-foreground underline decoration-1 underline-offset-4">
              pelanggan Anda komplain.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Pantau ketersediaan situs web, kecepatan respons HTTP, dan masa berlaku sertifikat SSL dari cloud tanpa instalasi agent server apa pun.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
            <Link
              href={user ? '/dashboard' : '/register'}
              className="w-full sm:w-auto h-9 px-5 rounded-lg font-medium text-xs sm:text-sm text-primary-foreground bg-primary hover:opacity-90 shadow-xs transition-opacity flex items-center justify-center gap-2"
            >
              <span>{user ? 'Menuju ke Dashboard' : 'Mulai Sekarang — Gratis'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/status/demo"
              className="w-full sm:w-auto h-9 px-4 rounded-lg font-medium text-xs sm:text-sm text-foreground bg-background hover:bg-muted border border-border transition-colors flex items-center justify-center gap-2"
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Lihat Status Page Demo</span>
            </Link>
          </div>
        </section>

        {/* 3 Core Features Grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-1.5 mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Tiga Pilar Pemantauan Komprehensif
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Dirancang untuk developer, instansi, dan UMKM yang membutuhkan kepastian keandalan sistem digital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature 1: Uptime */}
            <div className="bg-background p-5 rounded-lg border border-border space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-muted text-foreground flex items-center justify-center border border-border">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Pengecekan HTTP & Latensi
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pengecekan berkala otomatis setiap 5 hingga 60 menit dengan verifikasi kegagalan beruntun untuk meminimalisir false positive.
              </p>
            </div>

            {/* Feature 2: SSL */}
            <div className="bg-background p-5 rounded-lg border border-border space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-muted text-foreground flex items-center justify-center border border-border">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Pemantauan Sertifikat SSL
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inspeksi berkala TLS port 443. Menghitung sisa hari berlaku sertifikat SSL dan memberi peringatan dini sebelum kedaluwarsa.
              </p>
            </div>

            {/* Feature 3: Status Page */}
            <div className="bg-background p-5 rounded-lg border border-border space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-muted text-foreground flex items-center justify-center border border-border">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Halaman Status Publik
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transparansi uptime melalui URL publik dengan visualisasi bar uptime 90 hari, banner status agregat, dan log insiden 14 hari.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Comparison Table (Free vs Pro) */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-1.5 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Paket Langganan Transparan
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Mulai gratis dengan paket Free, atau upgrade ke paket Pro kapan saja secara instan.
            </p>
          </div>

          <div className="bg-background border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="py-3 px-4 font-semibold text-muted-foreground">
                      Fitur & Batasan Kuota
                    </th>
                    <th className="py-3 px-4 font-semibold text-foreground text-center w-36">
                      Free (Rp 0)
                    </th>
                    <th className="py-3 px-4 font-semibold text-foreground text-center w-40 border-l border-border bg-background">
                      Pro (Simulasi)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-foreground flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Jumlah Monitor Maksimal</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">3 monitor</td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-foreground border-l border-border bg-background">
                      20 monitor
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Interval Pengecekan</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">10 - 60 menit</td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-foreground border-l border-border bg-background">
                      5 - 60 menit
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-medium text-foreground flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Jumlah Halaman Status Publik</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">1 halaman</td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-foreground border-l border-border bg-background">
                      5 halaman
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-medium text-foreground flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Retensi Riwayat Pemeriksaan</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">7 hari</td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-foreground border-l border-border bg-background">
                      30 hari
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-medium text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Inspeksi Masa Berlaku SSL/TLS</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Check className="w-4 h-4 text-foreground mx-auto" />
                    </td>
                    <td className="py-2.5 px-4 text-center border-l border-border bg-background">
                      <Check className="w-4 h-4 text-foreground mx-auto" />
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-medium text-foreground flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Proteksi SSRF Jaringan Privat</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Check className="w-4 h-4 text-foreground mx-auto" />
                    </td>
                    <td className="py-2.5 px-4 text-center border-l border-border bg-background">
                      <Check className="w-4 h-4 text-foreground mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-muted border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Peralihan paket dapat disimulasikan kapan saja tanpa kartu kredit melalui menu Pengaturan.
              </p>
              <Link
                href={user ? '/dashboard' : '/register'}
                className="h-8 px-3.5 rounded-lg font-medium text-xs text-primary-foreground bg-primary hover:opacity-90 shadow-xs transition-opacity whitespace-nowrap inline-flex items-center"
              >
                {user ? 'Buka Dashboard' : 'Mulai Akun Gratis'}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-background">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-foreground" />
            <span className="font-semibold text-foreground">StatusWatch</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-[11px]">
            Arsitektur SaaS Serverless (Next.js 15 + Supabase + GitHub Actions)
          </p>
        </div>
      </footer>
    </div>
  );
}
