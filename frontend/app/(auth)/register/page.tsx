'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction } from '../actions';
import { UserPlus, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div>
      <div className="mb-5 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Daftar Akun Baru
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Mulai pantau ketersediaan situs web Anda secara otomatis
        </p>
      </div>

      <div className="mb-4 p-2.5 rounded-lg bg-muted border border-border flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 shrink-0 text-foreground" />
        <span>Paket awal otomatis <strong className="text-foreground">Free</strong> (3 monitor, interval 10 menit).</span>
      </div>

      {state?.error && (
        <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--status-down-bg))] border border-[hsl(var(--status-down))] flex items-start gap-2 text-xs text-[hsl(var(--status-down))]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      {state?.success && state?.message && (
        <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--status-up-bg))] border border-[hsl(var(--status-up))] flex items-start gap-2 text-xs text-[hsl(var(--status-up))]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{state.message}</p>
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
          <label
            htmlFor="password"
            className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1"
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
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 h-9 px-4 rounded-lg font-medium text-xs sm:text-sm text-primary-foreground bg-primary hover:opacity-90 shadow-xs flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Mendaftarkan...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Sekarang</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-border text-center text-xs text-muted-foreground">
        Sudah memiliki akun?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground underline hover:opacity-80"
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
