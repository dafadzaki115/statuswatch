'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction } from '../actions';
import { UserPlus, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Daftar Akun Baru
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Mulai pantau situs Anda secara otomatis dalam hitungan menit.
        </p>
      </div>

      <div className="mb-5 p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>Paket awal otomatis <strong>Free</strong> (3 monitor, interval minimum 10 menit).</span>
      </div>

      {state?.error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      {state?.success && state?.message && (
        <div className="mb-5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
          <p>{state.message}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@domain.com"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Kata Sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Minimal 8 karakter"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mendaftarkan...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Daftar Sekarang</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        Sudah memiliki akun?{' '}
        <Link
          href="/login"
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
