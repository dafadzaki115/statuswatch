'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createMonitorAction } from '../actions';
import { Loader2, Plus, AlertCircle, Info } from 'lucide-react';
import type { PlanType } from '@statuswatch/backend';

interface Props {
  plan: PlanType;
  statusPages: Array<{ id: string; title: string }>;
}

export function MonitorForm({ plan, statusPages }: Props) {
  const [state, formAction, isPending] = useActionState(createMonitorAction, null);

  const isFree = plan === 'free';

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      {/* Nama Monitor */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Nama Monitor <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="Contoh: Website Toko Utama"
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Target URL */}
      <div>
        <label
          htmlFor="url"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
        >
          URL Target <span className="text-red-500">*</span>
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          maxLength={2048}
          placeholder="https://example.com/health"
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Wajib diawali dengan <code className="text-emerald-600">http://</code> atau{' '}
          <code className="text-emerald-600">https://</code>. Localhost dan IP privat ditolak oleh sistem proteksi SSRF.
        </p>
      </div>

      {/* Grid: Method & Expected Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="method"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            HTTP Method
          </label>
          <select
            id="method"
            name="method"
            defaultValue="GET"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          >
            <option value="GET">GET (Standar)</option>
            <option value="HEAD">HEAD (Hanya Header)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="expected_status"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Status Code Diharapkan
          </label>
          <input
            id="expected_status"
            name="expected_status"
            type="number"
            min={100}
            max={599}
            defaultValue={200}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid: Interval & Timeout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="interval_minutes"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Interval Pemeriksaan
          </label>
          <select
            id="interval_minutes"
            name="interval_minutes"
            defaultValue={isFree ? '10' : '5'}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          >
            {!isFree && <option value="5">Setiap 5 menit (Pro)</option>}
            <option value="10">Setiap 10 menit</option>
            <option value="30">Setiap 30 menit</option>
            <option value="60">Setiap 60 menit</option>
          </select>
          {isFree && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <Info className="w-3 h-3 shrink-0" />
              <span>Paket Free dibatasi minimum 10 menit.</span>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="timeout_ms"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Batas Waktu Timeout (ms)
          </label>
          <input
            id="timeout_ms"
            name="timeout_ms"
            type="number"
            min={1000}
            max={8000}
            step={500}
            defaultValue={5000}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Hubungkan ke Status Page (opsional) */}
      {statusPages.length > 0 && (
        <div>
          <label
            htmlFor="status_page_id"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Tampilkan di Status Page (Opsional)
          </label>
          <select
            id="status_page_id"
            name="status_page_id"
            defaultValue=""
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          >
            <option value="">Jangan tampilkan di status page mana pun</option>
            {statusPages.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Buttons */}
      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          href="/monitors"
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Simpan Monitor</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
