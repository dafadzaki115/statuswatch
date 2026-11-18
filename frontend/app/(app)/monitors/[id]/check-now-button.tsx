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
          message: data.error?.message || 'Pengecekan gagal',
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Selesai! Status: ${data.data?.isUp ? 'UP' : 'DOWN'} (${data.data?.responseMs}ms)`,
        });
        router.refresh();
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Koneksi ke endpoint check gagal',
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
        className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Mengecek...' : 'Check Now'}</span>
      </button>

      {feedback && (
        <div
          className={`absolute right-0 top-full mt-2 w-64 p-2.5 rounded-xl shadow-lg border text-xs z-20 flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="truncate">{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
