// Parse civil dates in UTC so daylight-saving changes never add or remove a day.
export function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.slice(0,4) === '0000') throw new Error('Choose a valid date.');
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new Error('Choose a valid calendar date.');
  return date;
}

// Clamp month anniversaries: January 31 plus one month becomes February's last day.
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const last = new Date(result);
  last.setUTCMonth(last.getUTCMonth() + 1);
  last.setUTCDate(0);
  result.setUTCDate(Math.min(date.getUTCDate(),last.getUTCDate()));
  return result;
}

// Report whole calendar months plus remaining days, and elapsed days independently.
export function dateDifference(startValue: string, endValue: string) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (end < start) throw new Error('The end date must be on or after the start date.');
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  if (addMonths(start,months) > end) months--;
  const anchor = addMonths(start,months);
  return { years:Math.floor(months / 12), months:months % 12, days:(end.getTime() - anchor.getTime()) / 86400000, totalMonths:months, totalDays:(end.getTime() - start.getTime()) / 86400000 };
}

// Today's date follows the user's device calendar, formatted without UTC shifting.
export function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
