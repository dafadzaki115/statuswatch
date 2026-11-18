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
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800">
        <p className="text-slate-400 font-medium">{data.time}</p>
        <p className="text-sm font-bold text-emerald-400">
          {data.responseMs} ms
        </p>
        <p className="text-[11px] text-slate-300">
          Status:{' '}
          <span className={data.isUp ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Grafik Waktu Respons
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pergerakan latensi respons server (ms) selama periode pemantauan.
          </p>
        </div>

        {/* Tab Pemilih Rentang Waktu */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setRange('24h')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === '24h'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            24 Jam Terakhir
          </button>
          <button
            type="button"
            onClick={() => setRange('7d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === '7d'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            7 Hari Terakhir
          </button>
        </div>
      </div>

      {activeData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Belum ada data riwayat pengecekan untuk rentang waktu ini.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Data akan muncul secara bertahap setelah pengecekan otomatis atau tombol &quot;Check Now&quot; dijalankan.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              />
              <YAxis
                unit="ms"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="responseMs"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#latencyGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
