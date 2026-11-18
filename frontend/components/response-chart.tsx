'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export interface ChartCheckPoint {
  time: string;
  responseMs: number;
  isUp: boolean;
  statusCode: number | null;
}

interface ResponseChartProps {
  checks24h: ChartCheckPoint[];
  checks7d: ChartCheckPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartCheckPoint;
    value?: number;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0]?.payload;
    if (!data) return null;
    return (
      <div className="bg-background text-foreground p-3 rounded-lg shadow-md text-xs space-y-1 border border-border">
        <p className="text-muted-foreground font-mono">{data.time}</p>
        <p className="text-sm font-bold font-mono tabular-nums text-foreground">
          {data.responseMs} ms
        </p>
        <p className="text-[11px] text-muted-foreground">
          Status:{' '}
          <span
            className={
              data.isUp
                ? 'text-[hsl(var(--status-up))] font-semibold'
                : 'text-[hsl(var(--status-down))] font-semibold'
            }
          >
            {data.isUp ? 'UP' : 'DOWN'}
          </span>
          {data.statusCode ? ` (${data.statusCode})` : ''}
        </p>
      </div>
    );
  }
  return null;
}

export function ResponseChart({ checks24h, checks7d }: ResponseChartProps) {
  const [range, setRange] = useState<'24h' | '7d'>('24h');
  const activeData = range === '24h' ? checks24h : checks7d;

  return (
    <div className="bg-background border border-border rounded-lg p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Waktu Respons
          </h2>
          <p className="text-xs text-muted-foreground">
            Latensi respons server (ms) selama periode pemantauan.
          </p>
        </div>

        {/* Tab Pemilih Rentang Waktu */}
        <div className="inline-flex items-center p-0.5 bg-muted rounded-md text-xs font-medium self-start sm:self-auto border border-border">
          <button
            type="button"
            onClick={() => setRange('24h')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              range === '24h'
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            24 Jam
          </button>
          <button
            type="button"
            onClick={() => setRange('7d')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              range === '7d'
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            7 Hari
          </button>
        </div>
      </div>

      {activeData.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-border rounded-lg bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Belum ada data riwayat pengecekan untuk rentang waktu ini.
          </p>
        </div>
      ) : (
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border opacity-50" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                stroke="currentColor"
                className="text-muted-foreground font-mono"
              />
              <YAxis
                unit="ms"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                stroke="currentColor"
                className="text-muted-foreground font-mono"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="responseMs"
                stroke="currentColor"
                className="text-foreground"
                strokeWidth={1.5}
                fill="currentColor"
                fillOpacity={0.06}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
