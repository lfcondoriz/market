/**
 * Formats a number with appropriate decimal places and thousands separators.
 */
export function formatPrice(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) return '-';
  if (Math.abs(value) < 0.0001 && value !== 0) {
    return value.toExponential(4);
  }
  if (Math.abs(value) < 1 && value !== 0) {
    return value.toFixed(6);
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a funding rate value as percentage string with sign (e.g. +0.0100%).
 */
export function formatFundingPct(pct: number | undefined | null, decimals: number = 4): string {
  if (pct === undefined || pct === null || isNaN(pct)) return '-';
  const prefix = pct > 0 ? '+' : '';
  return `${prefix}${pct.toFixed(decimals)}%`;
}

/**
 * Formats volume numbers in compact format (K, M, B).
 */
export function formatCompactVolume(vol: number | undefined | null): string {
  if (!vol || isNaN(vol)) return '0';
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`;
  return vol.toFixed(2);
}

/**
 * Checks if a Unix timestamp in seconds falls on a weekend (Saturday=6 or Sunday=0 in UTC).
 */
export function isWeekendTimestamp(timestampSec: number): boolean {
  const date = new Date(timestampSec * 1000);
  const day = date.getUTCDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Gets day name in Spanish for a given timestamp.
 */
export function getWeekdayName(timestampSec: number): string {
  const date = new Date(timestampSec * 1000);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getUTCDay()];
}
