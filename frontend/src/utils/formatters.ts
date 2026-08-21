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
 * Formats APR percentage string with sign (e.g. +10.95% APR).
 */
export function formatAprPct(apr: number | undefined | null, decimals: number = 2): string {
  if (apr === undefined || apr === null || isNaN(apr)) return '-';
  const prefix = apr > 0 ? '+' : '';
  return `${prefix}${apr.toFixed(decimals)}% APR`;
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

/**
 * Formats a Unix timestamp into a readable date-time string (e.g. "21 Ago 2026, 16:00 UTC").
 */
export function formatDateTimeUTC(timestampSec: number): string {
  const date = new Date(timestampSec * 1000);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
}
