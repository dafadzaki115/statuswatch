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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-background border border-border rounded-lg max-w-md w-full p-6 shadow-xs space-y-3">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-down-bg))] text-[hsl(var(--status-down))] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <h1 className="text-base font-semibold text-foreground">
          Terjadi Kendala pada Halaman
        </h1>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Mohon maaf, sistem mengalami kesalahan saat memuat data. Silakan tekan tombol coba lagi di bawah untuk memuat ulang.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="h-8 px-3.5 rounded-lg text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 shadow-xs transition-opacity inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
