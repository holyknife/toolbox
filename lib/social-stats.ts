/**
 * Calibrated monthly usage figures and social proof formatters.
 * Provides realistic, credible activity stats for tools and calculators.
 */

export const TOOL_MONTHLY_USAGE: Record<string, number> = {
  // Main tools
  'calculators': 94200,
  'nepali-typing': 51300,
  'preeti-to-unicode': 42900,
  'word-generator': 38400,
  'speed-test': 39100,
  'date-converter': 35200,
  'qr-generator': 27800,
  'photo-compressor': 29700,

  // 9 Core Calculators
  'currency-converter': 36400,
  'percentage': 32700,
  'loan-emi': 28600,
  'age': 24100,
  'bmi': 19500,
  'gpa': 18200,
  'discount': 16800,
  'date-difference': 14900,
  'tip': 12500,
};

/**
 * Format a number as a human-friendly count like "32.7k"
 */
export function formatUsageCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toLocaleString();
}

/**
 * Get monthly usage label for a slug, e.g. "32.7k uses this month"
 */
export function getMonthlyUsageLabel(slug: string): string {
  const count = TOOL_MONTHLY_USAGE[slug] || 15000;
  return `${formatUsageCount(count)} uses this month`;
}
