'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '../actions';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div>
      <div className="mb-5 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Masuk ke Akun
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Masukkan email dan kata sandi untuk mengakses dashboard
        </p>
      </div>

      {state?.error && (
        <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--status-down-bg))] border border-[hsl(var(--status-down))] flex items-start gap-2 text-xs text-[hsl(var(--status-down))]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-3.5">
        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1"
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
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
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
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 h-9 px-4 rounded-lg font-medium text-xs sm:text-sm text-primary-foreground bg-primary hover:opacity-90 shadow-xs flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Memverifikasi...</span>
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-border text-center text-xs text-muted-foreground">
        Belum memiliki akun?{' '}
        <Link
          href="/register"
          className="font-medium text-foreground underline hover:opacity-80"
        >
          Daftar sekarang
        </Link>
      </div>
    </div>
  );
}
