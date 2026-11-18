'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '../actions';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Masuk ke Akun Anda
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Masukkan email dan kata sandi untuk mengakses dashboard monitor.
        </p>
      </div>

      {state?.error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <p>{state.error}</p>
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
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Kata Sandi
            </label>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memverifikasi...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Masuk</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        Belum memiliki akun?{' '}
        <Link
          href="/register"
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Daftar sekarang
        </Link>
      </div>
    </div>
  );
}
