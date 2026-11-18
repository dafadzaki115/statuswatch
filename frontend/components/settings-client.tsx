'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Zap,
  Check,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Server,
  Clock,
  Radio,
  Calendar,
  Loader2,
} from 'lucide-react';
import { logoutAction } from '@/app/(auth)/actions';

interface SettingsClientProps {
  userEmail: string;
  currentPlan: 'free' | 'pro';
  monitorCount: number;
  statusPageCount: number;
}

export function SettingsClient({
  userEmail,
  currentPlan,
  monitorCount,
  statusPageCount,
}: SettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePlanChange = async (targetPlan: 'free' | 'pro') => {
    if (targetPlan === currentPlan) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error?.message || 'Gagal memperbarui paket langganan.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Berhasil beralih ke paket ${targetPlan.toUpperCase()}! Kuota dan fitur Anda telah diperbarui.`,
        });
        router.refresh();
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Koneksi ke server terputus saat memproses perubahan paket.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Pengaturan Akun & Paket Langganan
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Kelola profil pengguna, status langganan simulasi SaaS, dan kuota pemantauan Anda.
        </p>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))] border-[hsl(var(--status-up))]'
              : 'bg-[hsl(var(--status-down-bg))] text-[hsl(var(--status-down))] border-[hsl(var(--status-down))]'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-[hsl(var(--status-up))]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[hsl(var(--status-down))]" />
          )}
          <p className="flex-1 leading-relaxed">{feedback.message}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-background border border-border rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span>Informasi Akun</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-lg bg-muted border border-border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Alamat Email
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground truncate font-mono">
              {userEmail}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-muted border border-border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Paket Aktif Saat Ini
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold uppercase text-foreground font-mono">
                {currentPlan}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))]">
                Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Current Usage Stats */}
        <div className="pt-2 text-xs text-muted-foreground flex items-center gap-6 border-t border-border">
          <span>
            Monitor Aktif: <strong className="font-mono text-foreground">{monitorCount}</strong>/{currentPlan === 'pro' ? 20 : 3}
          </span>
          <span>
            Status Page: <strong className="font-mono text-foreground">{statusPageCount}</strong>/{currentPlan === 'pro' ? 5 : 1}
          </span>
        </div>
      </div>

      {/* Plan Selection Cards (Free vs Pro) */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <span>Pilihan Paket Langganan (Simulasi SaaS)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Paket FREE */}
          <div
            className={`bg-background rounded-lg p-5 border transition-all space-y-4 flex flex-col justify-between ${
              currentPlan === 'free'
                ? 'border-foreground shadow-xs ring-1 ring-foreground/20'
                : 'border-border'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Paket Free
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Untuk kebutuhan pemantauan dasar & proyek kecil.
                  </p>
                </div>
                {currentPlan === 'free' && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border">
                    Aktif
                  </span>
                )}
              </div>

              <div className="text-xl font-bold font-mono text-foreground">
                Rp 0 <span className="text-xs font-normal text-muted-foreground">/ selamanya</span>
              </div>

              {/* Fitur Free */}
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Maksimal <strong className="text-foreground">3 monitor</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Interval cek minimum <strong className="text-foreground">10 menit</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span><strong className="text-foreground">1 status page</strong> publik</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Retensi data riwayat <strong className="text-foreground">7 hari</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Pemantauan SSL/TLS otomatis</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              {currentPlan === 'free' ? (
                <button
                  type="button"
                  disabled
                  className="w-full h-8 rounded-lg text-xs font-medium text-muted-foreground bg-muted cursor-not-allowed text-center"
                >
                  Paket Anda Sekarang
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handlePlanChange('free')}
                  className="w-full h-8 rounded-lg text-xs font-medium text-foreground border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Turun ke Free</span>
                </button>
              )}
            </div>
          </div>

          {/* Paket PRO */}
          <div
            className={`bg-background rounded-lg p-5 border transition-all space-y-4 flex flex-col justify-between relative ${
              currentPlan === 'pro'
                ? 'border-foreground shadow-xs ring-1 ring-foreground/20'
                : 'border-border'
            }`}
          >
            {currentPlan !== 'pro' && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider">
                Rekomendasi
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-1.5">
                    <span>Paket Pro</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Untuk developer profesional, instansi, dan UMKM berkembang.
                  </p>
                </div>
                {currentPlan === 'pro' && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border">
                    Aktif
                  </span>
                )}
              </div>

              <div className="text-xl font-bold font-mono text-foreground">
                Rp 49.000 <span className="text-xs font-normal text-muted-foreground">/ bulan (Simulasi)</span>
              </div>

              {/* Fitur Pro */}
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Maksimal <strong className="text-foreground">20 monitor</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Interval cek lebih cepat: <strong className="text-foreground">5 menit</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Hingga <strong className="text-foreground">5 status page</strong> publik</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Retensi data riwayat diperpanjang ke <strong className="text-foreground">30 hari</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Prioritas pemeriksaan cron cloud</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              {currentPlan === 'pro' ? (
                <button
                  type="button"
                  disabled
                  className="w-full h-8 rounded-lg text-xs font-medium text-muted-foreground bg-muted cursor-not-allowed text-center"
                >
                  Paket Anda Sekarang
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handlePlanChange('pro')}
                  className="w-full h-8 rounded-lg text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 shadow-xs transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Upgrade ke Pro (Gratis Demo)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Card */}
      <div className="bg-background border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Keluar dari Akun (Logout)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Akhiri sesi login Anda di perangkat ini secara aman.
          </p>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="h-8 px-3 rounded-lg text-xs font-medium text-[hsl(var(--status-down))] border border-border bg-background hover:bg-[hsl(var(--status-down-bg))] transition-colors inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Akun</span>
          </button>
        </form>
      </div>
    </div>
  );
}
