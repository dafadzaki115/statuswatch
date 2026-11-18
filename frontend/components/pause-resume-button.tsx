'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause } from 'lucide-react';

interface PauseResumeButtonProps {
  monitorId: string;
  isActive: boolean;
}

export function PauseResumeButton({ monitorId, isActive }: PauseResumeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/monitors/${monitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors flex items-center gap-1.5 disabled:opacity-60 ${
        isActive
          ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
          : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
      }`}
    >
      {isActive ? (
        <>
          <Pause className="w-4 h-4 text-amber-600" />
          <span>{loading ? 'Menjeda...' : 'Jeda Monitor'}</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4 text-emerald-600" />
          <span>{loading ? 'Mengaktifkan...' : 'Lanjutkan Monitor'}</span>
        </>
      )}
    </button>
  );
}
