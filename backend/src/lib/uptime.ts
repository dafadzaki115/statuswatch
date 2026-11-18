// ============================================
// Utility perhitungan uptime
// ============================================

/**
 * Menghitung persentase uptime dari array boolean is_up.
 * Mengembalikan null jika tidak ada data.
 */
export function calculateUptimePercent(checks: { is_up: boolean }[]): number | null {
  if (checks.length === 0) return null;
  const upCount = checks.filter((c) => c.is_up).length;
  return Math.round((upCount / checks.length) * 10000) / 100;
}
