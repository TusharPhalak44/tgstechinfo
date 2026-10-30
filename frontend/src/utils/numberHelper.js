/**
 * Number & View Count formatting utilities.
 */

/**
 * Formats content view counts into "M" (Millions) format.
 * Examples:
 *   75,400,000 -> "75.4M"
 *   2,000,000  -> "2M"
 *   1,945,431  -> "1.9M"
 *   1,225,645  -> "1.2M"
 *   971,557    -> "1M"
 *   475,487    -> "0.5M"
 *   261,106    -> "0.3M"
 *   50,000     -> "0.1M"
 *   0          -> "0M"
 */
export function formatViewsToM(num) {
  if (num === null || num === undefined) return '0M';
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) || 0 : Number(num) || 0;
  if (n <= 0) return '0M';

  const m = n / 1000000;
  if (m >= 1000) {
    return `${m.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}M`;
  }
  if (m >= 1) {
    return `${m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  // Under 1 Million (e.g. 971,557 -> 1M, 475,487 -> 0.5M, 261,106 -> 0.3M)
  const fixed = m.toFixed(1);
  if (fixed === '0.0') {
    const fixed2 = m.toFixed(2);
    return `${fixed2 === '0.00' ? '0.01' : fixed2.replace(/\.00$/, '')}M`;
  }
  return `${fixed.replace(/\.0$/, '')}M`;
}

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

export default {
  formatViewsToM,
  formatViewsToK
};
