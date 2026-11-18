'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteStatusPageDialogProps {
  pageId: string;
  pageTitle: string;
}

export function DeleteStatusPageDialog({ pageId, pageTitle }: DeleteStatusPageDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/status-pages/${pageId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Gagal menghapus status page');
        setLoading(false);
      } else {
        setIsOpen(false);
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
        className="h-8 px-2.5 rounded-lg text-xs font-medium text-[hsl(var(--status-down))] border border-border bg-background hover:bg-[hsl(var(--status-down-bg))] transition-colors inline-flex items-center gap-1"
        title="Hapus Halaman Status"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Hapus</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-background border border-border rounded-lg max-w-md w-full p-5 shadow-lg space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-md bg-[hsl(var(--status-down-bg))] text-[hsl(var(--status-down))] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">
                Hapus Status Page &quot;{pageTitle}&quot;?
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Tindakan ini akan menghapus halaman status publik secara permanen. Monitor yang sebelumnya ditautkan tidak akan terhapus, melainkan dilepas dari status page ini.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-[hsl(var(--status-down-bg))] border border-[hsl(var(--status-down))] rounded-lg text-xs text-[hsl(var(--status-down))]">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="h-8 px-3 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="h-8 px-3 rounded-lg text-xs font-medium text-white bg-[hsl(var(--status-down))] hover:opacity-90 shadow-xs transition-opacity flex items-center gap-1.5 disabled:opacity-60"
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
