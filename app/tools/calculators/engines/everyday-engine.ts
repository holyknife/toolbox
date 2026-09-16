import {
  bsToAd,
  adToBs,
  daysInMonth,
  type CalendarDate,
} from '../../date-converter/convert';
import { NEA_DOMESTIC_TARIFF } from '../config/nepal-electricity-tariffs';

/**
 * 1 Tola = 11.6638 grams in Nepal / South Asia bullion standard.
 */
export const GRAMS_PER_TOLA = 11.6638;

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
 * Nepal Electricity Authority (NEA) bill estimation.
 */
export function calculateNeaBill(
  units: number,
  amperage: '5A' | '15A' | '30A' | '60A' = '5A'
): {
  unitsConsumed: number;
  minimumCharge: number;
  energyCharge: number;
  totalBill: number;
  breakdown: { slab: string; units: number; rate: number; cost: number }[];
  tariffVersion: string;
} {
  const amp = NEA_DOMESTIC_TARIFF.amperageOptions.find(a => a.id === amperage) ?? NEA_DOMESTIC_TARIFF.amperageOptions[0];
  const u = Math.max(0, units);

  let energyCharge = 0;
  let remaining = u;
  const breakdown: { slab: string; units: number; rate: number; cost: number }[] = [];

  // Determine applicable minimum service charge based on consumption tier
  let activeMinCharge = amp.slabs[0].minCharge;
  for (const slab of amp.slabs) {
    if (u >= slab.minUnits) {
      activeMinCharge = slab.minCharge;
    }
  }

  // Progressive slab calculation
  let prevUpper = 0;
  for (const slab of amp.slabs) {
    if (remaining <= 0) break;
    const slabCapacity = slab.maxUnits - prevUpper;
    const unitsInSlab = Math.min(remaining, slabCapacity);

    if (unitsInSlab > 0) {
      const slabCost = unitsInSlab * slab.energyRate;
      energyCharge += slabCost;
      breakdown.push({
        slab: `${prevUpper + 1}–${slab.maxUnits === Infinity ? 'Above' : slab.maxUnits} units`,
        units: unitsInSlab,
        rate: slab.energyRate,
        cost: Number(slabCost.toFixed(2)),
      });
      remaining -= unitsInSlab;
    }
    prevUpper = slab.maxUnits;
  }

  const totalBill = Number((activeMinCharge + energyCharge).toFixed(2));

  return {
    unitsConsumed: u,
    minimumCharge: activeMinCharge,
    energyCharge: Number(energyCharge.toFixed(2)),
    totalBill,
    breakdown,
    tariffVersion: NEA_DOMESTIC_TARIFF.source,
  };
}

/**
 * Gold / Tola weight conversion and jewellery cost estimation.
 */
export function calculateGold(
  weightValue: number,
  unit: 'tola' | 'gram' | 'kg',
  ratePerTola = 0,
  makingCharge = 0,
  otherCharge = 0
): {
  tola: number;
  grams: number;
  kilograms: number;
  metalCost: number;
  totalCost: number;
} {
  let tola = 0;
  if (unit === 'tola') tola = Math.max(0, weightValue);
  else if (unit === 'gram') tola = Math.max(0, weightValue) / GRAMS_PER_TOLA;
  else if (unit === 'kg') tola = (Math.max(0, weightValue) * 1000) / GRAMS_PER_TOLA;

  const grams = tola * GRAMS_PER_TOLA;
  const kilograms = grams / 1000;
  const metalCost = tola * Math.max(0, ratePerTola);
  const totalCost = metalCost + Math.max(0, makingCharge) + Math.max(0, otherCharge);

  return {
    tola: Number(tola.toFixed(4)),
    grams: Number(grams.toFixed(3)),
    kilograms: Number(kilograms.toFixed(5)),
    metalCost: Math.round(metalCost),
    totalCost: Math.round(totalCost),
  };
}

/**
 * Trip / Fuel Cost Calculator.
 */
export function calculateTripFuel(
  distanceKm: number,
  mileageKmPerLitre: number,
  fuelPricePerLitre: number,
  passengers = 1,
  isRoundTrip = false
): {
  effectiveDistance: number;
  fuelRequiredLitres: number;
  totalCost: number;
  costPerPassenger: number;
} {
  const d = Math.max(0, distanceKm) * (isRoundTrip ? 2 : 1);
  const mileage = Math.max(0.1, mileageKmPerLitre);
  const price = Math.max(0, fuelPricePerLitre);
  const heads = Math.max(1, passengers);

  const litres = d / mileage;
  const total = litres * price;

  return {
    effectiveDistance: d,
    fuelRequiredLitres: Number(litres.toFixed(2)),
    totalCost: Math.round(total),
    costPerPassenger: Math.round(total / heads),
  };
}

/**
 * Attendance Calculator.
 */
export function calculateAttendance(
  classesHeld: number,
  classesAttended: number,
  targetPercent = 75
): {
  currentPercent: number;
  targetPercent: number;
  status: 'eligible' | 'shortage';
  canMissClasses: number;
  needToAttendConsecutive: number;
} {
  const held = Math.max(0, classesHeld);
  const attended = Math.min(held, Math.max(0, classesAttended));
  const target = Math.max(1, Math.min(100, targetPercent)) / 100;

  const currentPercent = held > 0 ? Number(((attended / held) * 100).toFixed(1)) : 100;

  if (currentPercent >= target * 100) {
    // How many can they miss without dropping below target?
    // attended / (held + X) >= target  =>  held + X <= attended / target  =>  X <= (attended / target) - held
    const canMiss = Math.max(0, Math.floor(attended / target - held));
    return {
      currentPercent,
      targetPercent: target * 100,
      status: 'eligible',
      canMissClasses: canMiss,
      needToAttendConsecutive: 0,
    };
  } else {
    // How many consecutive classes must they attend?
    // (attended + X) / (held + X) >= target  =>  attended + X >= target * held + target * X  =>  X(1 - target) >= target * held - attended
    const need = Math.ceil((target * held - attended) / (1 - target));
    return {
      currentPercent,
      targetPercent: target * 100,
      status: 'shortage',
      canMissClasses: 0,
      needToAttendConsecutive: Math.max(0, need),
    };
  }
}

/**
 * University SGPA & Cumulative CGPA.
 */
export interface CourseEntry {
  id?: string;
  name?: string;
  semester?: string;
  creditHours: number;
  gradePoint?: number;
  gpa?: number;
}

export interface SemesterItem extends CourseEntry {}

export function calculateSgpa(courses: CourseEntry[]): {
  sgpa: number;
  cgpa: number;
  totalCredits: number;
  totalGradePoints: number;
  totalQualityPoints: number;
} {
  let totalCredits = 0;
  let totalPoints = 0;

  for (const c of courses) {
    const cr = Math.max(0, c.creditHours);
    const gp = Math.max(0, Math.min(4.0, c.gradePoint ?? c.gpa ?? 0));
    totalCredits += cr;
    totalPoints += cr * gp;
  }

  const sgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
  return {
    sgpa,
    cgpa: sgpa,
    totalCredits,
    totalGradePoints: Number(totalPoints.toFixed(2)),
    totalQualityPoints: Number(totalPoints.toFixed(2)),
  };
}


/**
 * BMI Calculator.
 */
export function calculateBmi(
  weightKg: number,
  heightCm: number,
  isImperial = false,
  weightLbs = 0,
  heightInches = 0
): {
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
  healthRange: string;
} {
  let w = Math.max(0, weightKg);
  let hM = Math.max(0.1, heightCm / 100);

  if (isImperial) {
    w = Math.max(0, weightLbs) * 0.45359237;
    hM = Math.max(0.1, heightInches * 0.0254);
  }

  const bmi = Number((w / (hM * hM)).toFixed(1));
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

/**
 * Aspect Ratio Calculator.
 */
export function calculateAspectRatio(
  width: number,
  height: number,
  newWidth?: number,
  newHeight?: number
): {
  ratioText: string;
  ratio: string;
  decimalRatio: number;
  solvedWidth: number;
  solvedHeight: number;
  width: number;
  height: number;
} {
  const w = Math.max(1, width);
  const h = Math.max(1, height);

  // GCD for ratio representation
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(Math.round(w), Math.round(h));
  const ratioText = `${Math.round(w) / d}:${Math.round(h) / d}`;
  const decimalRatio = Number((w / h).toFixed(4));

  let solvedW = w;
  let solvedH = h;

  if (typeof newWidth === 'number' && newWidth > 0) {
    solvedW = newWidth;
    solvedH = Number((newWidth / decimalRatio).toFixed(1));
  } else if (typeof newHeight === 'number' && newHeight > 0) {
    solvedH = newHeight;
    solvedW = Number((newHeight * decimalRatio).toFixed(1));
  }

  return {
    ratioText,
    ratio: ratioText,
    decimalRatio,
    solvedWidth: solvedW,
    solvedHeight: solvedH,
    width: solvedW,
    height: solvedH,
  };
}
