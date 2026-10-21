/**
 * Number & View Count formatting utilities.
 */

/**
 * Formats content view counts into "M" (Millions) format.
 * Examples:
 *   1,945,431 -> "1.9M"
 *   1,225,645 -> "1.2M"
 *   2,000,000 -> "2M"
 *   971,557   -> "1.0M"
 *   475,487   -> "0.5M"
 *   261,106   -> "0.3M"
 *   50,000    -> "0.1M"
 *   0         -> "0M"
 */
export function formatViewsToM(num) {
  if (num === null || num === undefined) return '0M';
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) || 0 : Number(num) || 0;
  if (n <= 0) return '0M';

  const m = n / 1000000;
  if (m >= 100) {
    return `${Math.round(m)}M`;
  }
  if (m >= 1) {
    return `${m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  // Under 1 Million (e.g. 971,557 -> 1.0M, 475,487 -> 0.5M, 261,106 -> 0.3M)
  const fixed = m.toFixed(1);
  if (fixed === '0.0') {
    const fixed2 = m.toFixed(2);
    return fixed2 === '0.00' ? '0.01M' : `${fixed2}M`;
  }
  return `${fixed}M`;
}

export default {
  formatViewsToM
};
