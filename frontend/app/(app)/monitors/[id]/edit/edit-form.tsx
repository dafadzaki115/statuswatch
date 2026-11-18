'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { updateMonitorAction, deleteMonitorAction } from '../../actions';
import { Loader2, Save, AlertCircle, Info, Trash2 } from 'lucide-react';
import type { PlanType, Monitor } from '@statuswatch/backend';

interface Props {
  monitor: Monitor;
  plan: PlanType;
  statusPages: Array<{ id: string; title: string }>;
}

export function EditMonitorForm({ monitor, plan, statusPages }: Props) {
  const updateWithId = updateMonitorAction.bind(null, monitor.id);
  const [state, formAction, isPending] = useActionState(updateWithId, null);

  const isFree = plan === 'free';

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="p-3 rounded-lg border border-border bg-muted flex items-start gap-2 text-xs text-[hsl(var(--status-down))]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{state.error}</p>
          </div>
        )}

        {/* Status Aktif */}
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted border border-border">
          <div>
            <span className="text-xs font-semibold text-foreground">Status Monitor</span>
            <p className="text-[11px] text-muted-foreground">
              Jeda atau aktifkan kembali pengecekan otomatis untuk target ini.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={monitor.is_active}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

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
            defaultValue={monitor.name}
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
            defaultValue={monitor.url}
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-[11px] text-muted-foreground">
            Wajib diawali dengan <code className="font-mono text-foreground">http://</code> atau{' '}
            <code className="font-mono text-foreground">https://</code>.
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
              defaultValue={monitor.method}
              className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="GET">GET</option>
              <option value="HEAD">HEAD</option>
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
              defaultValue={monitor.expected_status}
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
              defaultValue={String(monitor.interval_minutes)}
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
              defaultValue={monitor.timeout_ms}
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
              defaultValue={monitor.status_page_id || ''}
              className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className="pt-3 flex items-center justify-between border-t border-border">
          <button
            type="button"
            onClick={async () => {
              if (confirm('Hapus monitor ini secara permanen? Riwayat pengecekan juga akan dihapus.')) {
                await deleteMonitorAction(monitor.id);
              }
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-[hsl(var(--status-down))] hover:bg-muted border border-border transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Monitor</span>
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/monitors/${monitor.id}`}
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
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
