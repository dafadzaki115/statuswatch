'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyLinkButtonProps {
  slug: string;
}

export function CopyLinkButton({ slug }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/status/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`h-8 px-2.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
        copied
          ? 'bg-[hsl(var(--status-up-bg))] text-[hsl(var(--status-up))] border-[hsl(var(--status-up))]'
          : 'bg-background text-foreground border-border hover:bg-muted'
      }`}
      title="Salin tautan status publik"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[hsl(var(--status-up))]" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
    </button>
  );
}
