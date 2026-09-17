import {
  bsToAd,
  adToBs,
  type CalendarDate,
} from '../../date-converter/convert';

/**
 * Calculates exact age in years, months, days and next birthday countdown.
 */
export function calculateAge(
  dobDate: CalendarDate,
  calendar: 'BS' | 'AD',
  asOfDate?: CalendarDate
): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  adDob: CalendarDate;
  bsDob: CalendarDate;
  nextBirthdayDays: number;
  dayOfWeek: string;
} {
  let adDob: CalendarDate;
  let bsDob: CalendarDate;

  if (calendar === 'BS') {
    bsDob = dobDate;
    adDob = bsToAd(dobDate);
  } else {
    adDob = dobDate;
    bsDob = adToBs(dobDate);
  }

  // Today in AD (UTC)
  const now = new Date();
  const currentAd: CalendarDate = asOfDate ?? {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };

  // Convert both to UTC timestamp for total elapsed days
  const dobUtc = Date.UTC(adDob.year, adDob.month - 1, adDob.day);
  const currentUtc = Date.UTC(currentAd.year, currentAd.month - 1, currentAd.day);
  const totalDays = Math.max(0, Math.floor((currentUtc - dobUtc) / 86400000));

  // Calendar difference
  let years = currentAd.year - adDob.year;
  let months = currentAd.month - adDob.month;
  let days = currentAd.day - adDob.day;

  if (days < 0) {
    months--;
    const prevMonthDays = new Date(Date.UTC(currentAd.year, currentAd.month - 1, 0)).getUTCDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  // Next birthday calculation in AD
  let nextBdayYear = currentAd.year;
  let nextBdayUtc = Date.UTC(nextBdayYear, adDob.month - 1, adDob.day);
  if (nextBdayUtc <= currentUtc) {
    nextBdayYear++;
    nextBdayUtc = Date.UTC(nextBdayYear, adDob.month - 1, adDob.day);
  }
  const nextBirthdayDays = Math.max(0, Math.ceil((nextBdayUtc - currentUtc) / 86400000));

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[new Date(dobUtc).getUTCDay()];

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays,
    adDob,
    bsDob,
    nextBirthdayDays,
    dayOfWeek,
  };
}

/**
 * Calculates date difference between two calendar dates.
 */
export function calculateDateDiff(
  start: CalendarDate,
  end: CalendarDate,
  calStart: 'BS' | 'AD',
  calEnd: 'BS' | 'AD'
): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  weeks: number;
} {
  const adStart = calStart === 'BS' ? bsToAd(start) : start;
  const adEnd = calEnd === 'BS' ? bsToAd(end) : end;

  const t1 = Date.UTC(adStart.year, adStart.month - 1, adStart.day);
  const t2 = Date.UTC(adEnd.year, adEnd.month - 1, adEnd.day);
  const diffDays = Math.max(0, Math.round((t2 - t1) / 86400000));

  let years = adEnd.year - adStart.year;
  let months = adEnd.month - adStart.month;
  let days = adEnd.day - adStart.day;

  if (days < 0) {
    months--;
    const prevDays = new Date(Date.UTC(adEnd.year, adEnd.month - 1, 0)).getUTCDate();
    days += prevDays;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays: diffDays,
    weeks: Number((diffDays / 7).toFixed(1)),
  };
}

/**
 * BMI Calculator.
 */
export function calculateBmi(
  weightKg: number,
  heightMeters: number
): {
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
  healthRange: string;
} {
  const w = Math.max(0, weightKg);
  const h = Math.max(0.1, heightMeters);

  const bmi = Number((w / (h * h)).toFixed(1));
  let category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';

  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obesity';

  return {
    bmi,
    category,
    healthRange: '18.5 – 24.9',
  };
}
