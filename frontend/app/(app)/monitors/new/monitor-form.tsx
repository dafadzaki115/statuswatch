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
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 rounded-lg border border-border bg-muted flex items-start gap-2 text-xs text-[hsl(var(--status-down))]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      {/* Nama Monitor */}
      <div className="space-y-1">
        <label
          htmlFor="name"
          className="block text-xs font-medium text-foreground"
        >
          Nama Monitor <span className="text-[hsl(var(--status-down))]">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="Contoh: Website Toko Utama"
          className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Target URL */}
      <div className="space-y-1">
        <label
          htmlFor="url"
          className="block text-xs font-medium text-foreground"
        >
          URL Target <span className="text-[hsl(var(--status-down))]">*</span>
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          maxLength={2048}
          placeholder="https://example.com/health"
          className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground">
          Wajib diawali dengan <code className="font-mono text-foreground">http://</code> atau{' '}
          <code className="font-mono text-foreground">https://</code>. Localhost dan IP privat ditolak oleh SSRF guard.
        </p>
      </div>

      {/* Grid: Method & Expected Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="method"
            className="block text-xs font-medium text-foreground"
          >
            HTTP Method
          </label>
          <select
            id="method"
            name="method"
            defaultValue="GET"
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="GET">GET (Standar)</option>
            <option value="HEAD">HEAD (Hanya Header)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="expected_status"
            className="block text-xs font-medium text-foreground"
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
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Grid: Interval & Timeout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="interval_minutes"
            className="block text-xs font-medium text-foreground"
          >
            Interval Pemeriksaan
          </label>
          <select
            id="interval_minutes"
            name="interval_minutes"
            defaultValue={isFree ? '10' : '5'}
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {!isFree && <option value="5">Setiap 5 menit (Pro)</option>}
            <option value="10">Setiap 10 menit</option>
            <option value="30">Setiap 30 menit</option>
            <option value="60">Setiap 60 menit</option>
          </select>
          {isFree && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Info className="w-3 h-3 shrink-0" />
              <span>Paket Free dibatasi minimum 10 menit.</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="timeout_ms"
            className="block text-xs font-medium text-foreground"
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
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Hubungkan ke Status Page (opsional) */}
      {statusPages.length > 0 && (
        <div className="space-y-1">
          <label
            htmlFor="status_page_id"
            className="block text-xs font-medium text-foreground"
          >
            Tampilkan di Status Page (Opsional)
          </label>
          <select
            id="status_page_id"
            name="status_page_id"
            defaultValue=""
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Jangan kaitkan ke status page mana pun</option>
            {statusPages.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Buttons */}
      <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
        <Link
          href="/monitors"
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan Monitor</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
