/**
 * Number & View Count formatting utilities.
 */

/**
 * Formats content view counts into "k" (Thousands) format.
 * Examples:
 *   1,945,431 -> "1,945.4k"
 *   1,225,645 -> "1,225.6k"
 *   2,000,000 -> "2,000k"
 *   971,557   -> "971.6k"
 *   475,487   -> "475.5k"
 *   261,106   -> "261.1k"
 *   50,000    -> "50k"
 *   1,200     -> "1.2k"
 *   500       -> "0.5k"
 *   0         -> "0k"
 */
export function formatViewsToK(num) {
  if (num === null || num === undefined) return '0k';
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) || 0 : Number(num) || 0;
  if (n <= 0) return '0k';

  const k = n / 1000;
  if (k >= 1) {
    const formatted = k >= 1000
      ? k.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
      : k.toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
  }
  // Under 1 thousand (e.g. 500 -> 0.5k, 50 -> 0.1k)
  const fixed = k.toFixed(1);
  if (fixed === '0.0') {
    const fixed2 = k.toFixed(2);
    return fixed2 === '0.00' ? '0.01k' : `${fixed2}k`;
  }
  return `${fixed}k`;
}

// Alias for backwards compatibility with existing imports across the app
export const formatViewsToM = formatViewsToK;

export default {
  formatViewsToK,
  formatViewsToM
};
