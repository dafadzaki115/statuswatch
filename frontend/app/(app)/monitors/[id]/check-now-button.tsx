'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

export function CheckNowButton({ monitorId }: { monitorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCheckNow = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/monitors/${monitorId}/check`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error?.message || 'Gagal memeriksa monitor. Coba lagi.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Selesai: ${data.data?.isUp ? 'UP' : 'DOWN'} (${data.data?.responseMs} ms)`,
        });
        router.refresh();
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal terhubung ke server. Periksa koneksi.',
      });
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCheckNow}
        disabled={loading}
        className="h-9 px-3.5 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Mengecek...' : 'Cek Sekarang'}</span>
      </button>

      {feedback && (
        <div
          className={`absolute right-0 top-full mt-2 w-72 p-2.5 rounded-lg shadow-md border text-xs z-30 flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-background text-foreground border-border'
              : 'bg-background text-[hsl(var(--status-down))] border-border'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 text-[hsl(var(--status-up))] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[hsl(var(--status-down))] shrink-0" />
          )}
          <span className="truncate font-mono">{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
