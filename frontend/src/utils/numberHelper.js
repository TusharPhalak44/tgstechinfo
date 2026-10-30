/**
 * Number & View Count formatting utilities.
 * 
 * Rules:
 * - 0 to 999: Exact integer number (e.g. 0, 5, 250, 999)
 * - 1,000 to 999,999: Thousands in "K" (e.g. 1K, 1.5K, 12.5K, 50K, 261.1K, 971.6K)
 * - 1,000,000+: Millions in "M" (e.g. 1M, 1.2M, 1.9M, 2M, 75.4M)
 */

export function formatViewsToM(num) {
  if (num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) || 0 : Number(num) || 0;
  if (isNaN(n) || n <= 0) return '0';

  // 1,000,000+ -> Display in M (Millions)
  if (n >= 1000000) {
    const m = n / 1000000;
    if (m >= 1000) {
      return `${m.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}M`;
    }
    return `${m.toFixed(1).replace(/\.0$/, '')}M`;
  }

  // 1,000 to 999,999 -> Display in K (Thousands)
  if (n >= 1000) {
    const k = n / 1000;
    if (k >= 999.95) return '999.9K';
    return `${k.toFixed(1).replace(/\.0$/, '')}K`;
  }

  // 0 to 999 -> Exact integer number
  return `${Math.round(n)}`;
}

export function formatViewsToK(num) {
  return formatViewsToM(num);
}

export const formatViewCount = formatViewsToM;

export default {
  formatViewsToM,
  formatViewsToK,
  formatViewCount
};
