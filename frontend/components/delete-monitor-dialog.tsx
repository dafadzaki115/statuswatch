'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteMonitorDialogProps {
  monitorId: string;
  monitorName: string;
}

export function DeleteMonitorDialog({ monitorId, monitorName }: DeleteMonitorDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/monitors/${monitorId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Gagal menghapus monitor');
        setLoading(false);
      } else {
        setIsOpen(false);
        router.push('/monitors');
        router.refresh();
      }
    } catch {
      setError('Koneksi ke server terputus');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-9 px-3.5 rounded-lg text-xs font-medium border border-border text-[hsl(var(--status-down))] hover:bg-muted transition-colors flex items-center gap-1.5"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Hapus</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity">
          <div className="bg-background border border-border rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-down))]" />
                <h3 className="text-sm font-semibold text-foreground">
                  Hapus Monitor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus monitor <strong className="text-foreground">&quot;{monitorName}&quot;</strong>? Seluruh riwayat pengecekan dan insiden terkait akan dihapus secara permanen.
            </p>

            {error && (
              <div className="p-3 bg-muted border border-border rounded-lg text-xs text-[hsl(var(--status-down))] font-mono">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="h-9 px-4 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="h-9 px-4 rounded-lg text-xs font-medium text-white bg-[hsl(var(--status-down))] hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{loading ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
