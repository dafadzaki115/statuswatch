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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pengaturan Akun & Paket Langganan
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Kelola profil pengguna, status langganan simulasi SaaS, dan kuota pemantauan Anda.
        </p>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/60 dark:text-red-200 dark:border-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <p className="flex-1 leading-relaxed">{feedback.message}</p>
        </div>
      )}

      {/* Profil Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          <span>Informasi Akun</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Alamat Email
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
              {userEmail}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Paket Aktif Saat Ini
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-extrabold uppercase text-emerald-600 dark:text-emerald-400 font-mono">
                {currentPlan}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Current Usage Stats */}
        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-6">
          <span>
            Monitor Aktif: <strong className="text-slate-900 dark:text-white">{monitorCount}</strong>/{currentPlan === 'pro' ? 20 : 3}
          </span>
          <span>
            Status Page: <strong className="text-slate-900 dark:text-white">{statusPageCount}</strong>/{currentPlan === 'pro' ? 5 : 1}
          </span>
        </div>
      </div>

      {/* Plan Selection Cards (Free vs Pro) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <span>Pilihan Paket Langganan (Simulasi SaaS)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Paket FREE */}
          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all space-y-5 flex flex-col justify-between ${
              currentPlan === 'free'
                ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 shadow-sm opacity-90'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Paket Free
                  </h3>
                  <p className="text-xs text-slate-500">
                    Untuk kebutuhan pemantauan dasar & proyek kecil.
                  </p>
                </div>
                {currentPlan === 'free' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Paket Saat Ini
                  </span>
                )}
              </div>

              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Rp 0 <span className="text-xs font-normal text-slate-400">/ selamanya</span>
              </div>

              {/* Fitur Free */}
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Maksimal <strong>3 monitor</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interval cek minimum <strong>10 menit</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>1 status page</strong> publik</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Retensi data riwayat <strong>7 hari</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Pemantauan SSL/TLS otomatis</span>
                </li>
              </ul>
            </div>

            <div>
              {currentPlan === 'free' ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-center"
                >
                  Paket Anda Sekarang
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handlePlanChange('free')}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Turun ke Free</span>
                </button>
              )}
            </div>
          </div>

          {/* Paket PRO */}
          <div
            className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all space-y-5 flex flex-col justify-between relative overflow-hidden ${
              currentPlan === 'pro'
                ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'border-emerald-300 dark:border-emerald-800/80 shadow-md'
            }`}
          >
            {/* Banner Rekomendasi */}
            {currentPlan !== 'pro' && (
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Rekomendasi
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Paket Pro</span>
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </h3>
                  <p className="text-xs text-slate-500">
                    Untuk developer profesional, instansi, dan UMKM berkembang.
                  </p>
                </div>
                {currentPlan === 'pro' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Paket Saat Ini
                  </span>
                )}
              </div>

              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Rp 49.000 <span className="text-xs font-normal text-slate-400">/ bulan (Simulasi)</span>
              </div>

              {/* Fitur Pro */}
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Maksimal <strong>20 monitor</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interval cek lebih cepat: <strong>5 menit</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Hingga <strong>5 status page</strong> publik</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Retensi data riwayat diperpanjang ke <strong>30 hari</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Prioritas pemeriksaan cron cloud</span>
                </li>
              </ul>
            </div>

            <div>
              {currentPlan === 'pro' ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-center"
                >
                  Paket Anda Sekarang
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handlePlanChange('pro')}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>Upgrade ke Pro (Gratis Demo)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Keluar dari Akun (Logout)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Akhiri sesi login Anda di perangkat ini secara aman.
          </p>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>
        </form>
      </div>
    </div>
  );
}
