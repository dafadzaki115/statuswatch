'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-8 shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Terjadi Kendala pada Halaman
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Mohon maaf, sistem mengalami kesalahan saat memuat data. Silakan tekan tombol coba lagi di bawah untuk memuat ulang.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-sm transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Coba Lagi</span>
        </button>
      </div>
    </div>
  );
}
