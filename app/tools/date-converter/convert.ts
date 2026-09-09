import calendarData from './calendar-data.json';

export interface CalendarDate { year: number; month: number; day: number }
export type Calendar = 'BS' | 'AD';
export const BS_MONTHS = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
export const AD_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MIN_BS_YEAR = 2000;
export const MAX_BS_YEAR = 2100;
const DAY_MS = 86400000;
const REFERENCE_AD = Date.UTC(1943, 3, 14);

// Validate bundled data once, rather than silently guessing missing month lengths.
function readCalendar(): Record<number, number[]> {
  const data: Record<string, unknown> = calendarData;
  const years: Record<number, number[]> = {};
  for (let year = MIN_BS_YEAR; year <= MAX_BS_YEAR; year++) {
    const months = data[year];
    if (!Array.isArray(months) || months.length !== 12 || !months.every(days => Number.isInteger(days) && days >= 29 && days <= 32)) {
      throw new Error(`Calendar data is missing or invalid for BS ${year}.`);
    }
    years[year] = months;
  }
  return years;
}
const bsYears = readCalendar();
const totalDays = Object.values(bsYears).reduce((total, months) => total + months.reduce((sum, days) => sum + days, 0), 0);
export const MIN_AD_DATE = fromTimestamp(REFERENCE_AD);
export const MAX_AD_DATE = fromTimestamp(REFERENCE_AD + (totalDays - 1) * DAY_MS);

// Use UTC throughout arithmetic so local time zones and DST cannot shift a date.
function fromTimestamp(timestamp: number): CalendarDate {
  const date = new Date(timestamp);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

// Reject invalid fields before Date.UTC can silently roll them into another month.
export function daysInMonth(calendar: Calendar, year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) throw new Error('Choose a valid year and month.');
  if (calendar === 'BS') {
    if (!bsYears[year]) throw new Error(`Supported Nepali years are ${MIN_BS_YEAR}–${MAX_BS_YEAR} BS.`);
    return bsYears[year][month - 1];
  }
  if (year < MIN_AD_DATE.year || year > MAX_AD_DATE.year) throw new Error('This Gregorian year is outside the supported calendar range.');
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Convert BS by counting whole days from the dataset's documented reference date.
export function bsToAd(date: CalendarDate): CalendarDate {
  const monthLength = daysInMonth('BS', date.year, date.month);
  if (!Number.isInteger(date.day) || date.day < 1 || date.day > monthLength) throw new Error('This day does not exist in the selected Nepali month.');
  let offset = date.day - 1;
  for (let year = MIN_BS_YEAR; year < date.year; year++) {
    for (const days of bsYears[year]) offset += days;
  }
  for (let month = 1; month < date.month; month++) offset += bsYears[date.year][month - 1];
  return fromTimestamp(REFERENCE_AD + offset * DAY_MS);
}

// Subtract BS months from a Gregorian day offset, rejecting both range boundaries.
export function adToBs(date: CalendarDate): CalendarDate {
  const monthLength = daysInMonth('AD', date.year, date.month);
  if (!Number.isInteger(date.day) || date.day < 1 || date.day > monthLength) throw new Error('This day does not exist in the selected Gregorian month.');
  let offset = (Date.UTC(date.year, date.month - 1, date.day) - REFERENCE_AD) / DAY_MS;
  if (offset < 0 || offset >= totalDays) throw new Error(`Choose an AD date from ${numericDate(MIN_AD_DATE)} to ${numericDate(MAX_AD_DATE)}.`);
  for (let year = MIN_BS_YEAR; year <= MAX_BS_YEAR; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthLength = bsYears[year][month - 1];
      if (offset < monthLength) return { year, month, day: offset + 1 };
      offset -= monthLength;
    }
  }
  throw new Error('This date is outside the supported calendar data.');
}

// Clamp the day when changing months, and restrict Gregorian boundary months too.
export function clampPickerDate(calendar: Calendar, date: CalendarDate): CalendarDate {
  const minimumYear = calendar === 'BS' ? MIN_BS_YEAR : MIN_AD_DATE.year;
  const maximumYear = calendar === 'BS' ? MAX_BS_YEAR : MAX_AD_DATE.year;
  const year = Math.max(minimumYear, Math.min(maximumYear, date.year));
  const month = Math.max(1, Math.min(12, date.month));
  const day = Math.max(1, Math.min(daysInMonth(calendar, year, month), date.day));
  const clamped = { year, month, day };
  if (calendar === 'AD') {
    const timestamp = Date.UTC(year, month - 1, day);
    if (timestamp < REFERENCE_AD) return { ...MIN_AD_DATE };
    if (timestamp > REFERENCE_AD + (totalDays - 1) * DAY_MS) return { ...MAX_AD_DATE };
  }
  return clamped;
}

// Define Today in Nepal even when the visitor's device uses a different time zone.
export function todayInNepal(now: Date = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now);
  const year = Number(parts.find(part => part.type === 'year')?.value);
  const month = Number(parts.find(part => part.type === 'month')?.value);
  const day = Number(parts.find(part => part.type === 'day')?.value);
  return { year, month, day };
}

// Include padded numeric dates so copied results are unambiguous.
export function numericDate(date: CalendarDate): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

// Month names are explicit about their calendar; weekday uses the equivalent AD date.
export function readableDate(date: CalendarDate, calendar: Calendar): string {
  const months = calendar === 'BS' ? BS_MONTHS : AD_MONTHS;
  return `${months[date.month - 1]} ${date.day}, ${date.year}`;
}

// Compute weekday from the same UTC civil date used for conversion.
export function weekday(date: CalendarDate): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}
