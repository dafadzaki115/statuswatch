// ============================================
// Utility perhitungan uptime & metrik monitor
// ============================================

/**
 * Menghitung persentase uptime dari array check is_up.
 * Mengembalikan null jika tidak ada data.
 */
export function calculateUptimePercent(checks: { is_up: boolean }[]): number | null {
  if (!checks || checks.length === 0) return null;
  const upCount = checks.filter((c) => c.is_up).length;
  return Math.round((upCount / checks.length) * 10000) / 100;
}

/**
 * Menghitung rata-rata waktu respons (ms).
 * Mengembalikan null jika tidak ada data.
 */
export function calculateAverageResponseTime(checks: { response_ms: number }[]): number | null {
  if (!checks || checks.length === 0) return null;
  const sum = checks.reduce((acc, c) => acc + (c.response_ms || 0), 0);
  return Math.round(sum / checks.length);
}

/**
 * Segmen harian untuk uptime bar 90 hari sesuai PRD FR-10.
 */
export interface DailyUptimeSegment {
  date: string; // YYYY-MM-DD
  uptimePercent: number | null;
  totalChecks: number;
  upChecks: number;
  status: 'green' | 'yellow' | 'red' | 'gray';
}

/**
 * Mengelompokkan riwayat check menjadi N hari segmen (default 90 hari)
 * Aturan warna PRD:
 * - Hijau: >= 99%
 * - Kuning: 95% s/d < 99%
 * - Merah: < 95%
 * - Abu-abu: tidak ada data check (0 check)
 */
export function calculateDailyUptimeSegments(
  checks: { checked_at: string; is_up: boolean }[],
  days: number = 90
): DailyUptimeSegment[] {
  const segments: DailyUptimeSegment[] = [];
  const now = new Date();

  // Buat bucket per tanggal YYYY-MM-DD
  const buckets = new Map<string, { total: number; up: number }>();
  for (const c of checks) {
    if (!c.checked_at) continue;
    const dateKey = new Date(c.checked_at).toISOString().slice(0, 10);
    const existing = buckets.get(dateKey) || { total: 0, up: 0 };
    existing.total++;
    if (c.is_up) existing.up++;
    buckets.set(dateKey, existing);
  }

  // Isi dari (days - 1) hari lalu sampai hari ini
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    const bucket = buckets.get(dateKey);

    if (!bucket || bucket.total === 0) {
      segments.push({
        date: dateKey,
        uptimePercent: null,
        totalChecks: 0,
        upChecks: 0,
        status: 'gray',
      });
    } else {
      const percent = Math.round((bucket.up / bucket.total) * 10000) / 100;
      let status: 'green' | 'yellow' | 'red' = 'green';
      if (percent < 95) {
        status = 'red';
      } else if (percent < 99) {
        status = 'yellow';
      }
      segments.push({
        date: dateKey,
        uptimePercent: percent,
        totalChecks: bucket.total,
        upChecks: bucket.up,
        status,
      });
    }
  }

  return segments;
}

/**
 * Memformat durasi detik ke dalam teks ramah pengguna Bahasa Indonesia.
 */
export function formatDurationSeconds(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '-';
  if (seconds < 60) return `${Math.round(seconds)} detik`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours} jam ${remainingMinutes} menit` : `${hours} jam`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days} hari ${remainingHours} jam` : `${days} hari`;
}
