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
      className="h-9 px-3.5 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50"
    >
      {isActive ? (
        <>
          <Pause className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{loading ? 'Menjeda...' : 'Jeda Monitor'}</span>
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{loading ? 'Mengaktifkan...' : 'Lanjutkan'}</span>
        </>
      )}
    </button>
  );
}
