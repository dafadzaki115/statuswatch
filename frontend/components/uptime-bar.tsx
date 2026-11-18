'use client';

import { useState } from 'react';
import type { DailyUptimeSegment } from '@statuswatch/backend';

interface UptimeBarProps {
  segments: DailyUptimeSegment[];
  uptimePercent: number | null;
}

export function UptimeBar({ segments, uptimePercent }: UptimeBarProps) {
  const [hoveredSegment, setHoveredSegment] = useState<DailyUptimeSegment | null>(null);

  // Jika segments kurang dari 90, gunakan apa adanya, jika 90, izinkan responsif di mobile
  const total = segments.length;

  return (
    <div className="space-y-2">
      {/* 90 Days Bar Visual */}
      <div className="relative">
        <div className="flex items-center gap-[2px] h-8 w-full overflow-hidden">
          {segments.map((seg, idx) => {
            let bgClass = 'bg-muted opacity-60'; // gray (no data)
            if (seg.status === 'green') {
              bgClass = 'bg-[hsl(var(--status-up))] hover:opacity-90';
            } else if (seg.status === 'yellow') {
              bgClass = 'bg-[hsl(var(--status-warn))] hover:opacity-90';
            } else if (seg.status === 'red') {
              bgClass = 'bg-[hsl(var(--status-down))] hover:opacity-90';
            }

            // Di layar mobile (< 640px), sembunyikan 45 hari pertama jika ada 90 segmen
            const isHiddenOnMobile = total === 90 && idx < 45;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredSegment(seg)}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`flex-1 h-7 rounded-[2px] transition-opacity cursor-pointer ${bgClass} ${
                  isHiddenOnMobile ? 'hidden sm:block' : 'block'
                }`}
              />
            );
          })}
        </div>

        {/* Hover Tooltip */}
        {hoveredSegment && (
          <div className="absolute left-1/2 -top-11 -translate-x-1/2 bg-background text-foreground text-xs px-2.5 py-1 rounded-lg shadow-md border border-border whitespace-nowrap z-30 pointer-events-none transition-opacity">
            <span className="font-mono text-muted-foreground">{hoveredSegment.date}:</span>{' '}
            {hoveredSegment.uptimePercent !== null ? (
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {hoveredSegment.uptimePercent}% ({hoveredSegment.upChecks}/{hoveredSegment.totalChecks} check)
              </span>
            ) : (
              <span className="text-muted-foreground font-mono">Tanpa data</span>
            )}
          </div>
        )}
      </div>

      {/* Legend & Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="hidden sm:inline">90 hari lalu</span>
        <span className="sm:hidden">45 hari lalu</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold tabular-nums text-foreground text-xs">
            {uptimePercent !== null ? `${uptimePercent}%` : '100%'}
          </span>
          <span className="text-muted-foreground">ketersediaan</span>
        </div>
        <span>Hari ini</span>
      </div>
    </div>
  );
}
