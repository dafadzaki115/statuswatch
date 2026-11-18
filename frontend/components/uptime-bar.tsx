'use client';

import { useState } from 'react';
import type { DailyUptimeSegment } from '@statuswatch/backend';

interface UptimeBarProps {
  segments: DailyUptimeSegment[];
  uptimePercent: number | null;
}

export function UptimeBar({ segments, uptimePercent }: UptimeBarProps) {
  const [hoveredSegment, setHoveredSegment] = useState<DailyUptimeSegment | null>(null);

  return (
    <div className="space-y-2">
      {/* 90 Days Bar Visual */}
      <div className="relative">
        <div className="flex items-center gap-[2px] h-8 w-full overflow-hidden">
          {segments.map((seg, idx) => {
            let bgClass = 'bg-slate-200 dark:bg-slate-800'; // gray (no data)
            if (seg.status === 'green') {
              bgClass = 'bg-emerald-500 hover:bg-emerald-400';
            } else if (seg.status === 'yellow') {
              bgClass = 'bg-amber-400 hover:bg-amber-300';
            } else if (seg.status === 'red') {
              bgClass = 'bg-red-500 hover:bg-red-400';
            }

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredSegment(seg)}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`flex-1 h-7 rounded-sm transition-all cursor-pointer ${bgClass}`}
              />
            );
          })}
        </div>

        {/* Hover Tooltip */}
        {hoveredSegment && (
          <div className="absolute left-1/2 -top-12 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 whitespace-nowrap z-30 pointer-events-none animate-in fade-in zoom-in-95">
            <span className="font-semibold">{hoveredSegment.date}:</span>{' '}
            {hoveredSegment.uptimePercent !== null ? (
              <span className="font-bold text-emerald-400">
                {hoveredSegment.uptimePercent}% ({hoveredSegment.upChecks}/{hoveredSegment.totalChecks} check)
              </span>
            ) : (
              <span className="text-slate-400">Tidak ada data</span>
            )}
          </div>
        )}
      </div>

      {/* Legend & Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span>90 hari lalu</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white font-mono">
            {uptimePercent !== null ? `${uptimePercent}%` : '100%'}
          </span>
          <span>uptime</span>
        </div>
        <span>Hari ini</span>
      </div>
    </div>
  );
}
