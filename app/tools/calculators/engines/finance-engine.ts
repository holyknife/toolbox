export interface EmiScheduleEntry {
  month: number;
  payment: number;
  principal: number;
  principalPart: number;
  interest: number;
  interestPart: number;
  balance: number;
}

export interface EmiResult {
  monthlyEmi: number;
  emi: number;
  totalInterest: number;
  totalRepayment: number;
  totalPayment: number;
  flatRateComparison?: {
    totalInterest: number;
    monthlyPayment: number;
    difference: number;
  };
  schedule: EmiScheduleEntry[];
}

/**
 * Calculates loan EMI, reducing balance interest, and amortization schedule.
 */
export function calculateEmi(principal: number, annualRate: number, durationMonths: number): EmiResult {
  const p = Math.max(0, principal);
  const months = Math.max(1, Math.round(durationMonths));
  const r = Math.max(0, annualRate) / 12 / 100;

  let emi: number;
  if (r === 0) {
    emi = p / months;
  } else {
    const factor = Math.pow(1 + r, months);
    emi = (p * r * factor) / (factor - 1);
  }

  const roundedEmi = Number(emi.toFixed(2));
  let balance = p;
  let totalInterest = 0;
  const schedule: EmiScheduleEntry[] = [];

  for (let m = 1; m <= months; m++) {
    const interest = Number((balance * r).toFixed(2));
    const principalPart = m === months ? balance : Number((roundedEmi - interest).toFixed(2));
    balance = Math.max(0, Number((balance - principalPart).toFixed(2)));
    totalInterest += interest;

    if (m <= 12 || m % 12 === 0 || m === months) {
      schedule.push({
        month: m,
        payment: roundedEmi,
        principal: principalPart,
        principalPart,
        interest,
        interestPart: interest,
        balance,
      });
    }
  }

  const totalRepayment = Number((p + totalInterest).toFixed(2));

  // Flat-rate comparison
  const flatTotalInterest = Number(((p * (annualRate / 100) * (months / 12))).toFixed(2));
  const flatMonthly = Number(((p + flatTotalInterest) / months).toFixed(2));

  return {
    monthlyEmi: roundedEmi,
    emi: roundedEmi,
    totalInterest: Number(totalInterest.toFixed(2)),
    totalRepayment,
    totalPayment: totalRepayment,
    flatRateComparison: {
      totalInterest: flatTotalInterest,
      monthlyPayment: flatMonthly,
      difference: Number((flatTotalInterest - totalInterest).toFixed(2)),
    },
    schedule,
  };
}

/**
 * VAT / Tax calculation (Add Tax or Remove Tax).
 */
export function calculateVat(
  amount: number,
  taxRate: number = 13,
  mode: 'add' | 'remove' = 'add'
): {
  baseAmount: number;
  taxAmount: number;
  vatAmount: number;
  finalAmount: number;
  totalWithVat: number;
} {
  const a = Math.max(0, amount);
  const rate = Math.max(0, taxRate);

  if (mode === 'add') {
    const tax = (a * rate) / 100;
    const finalAmount = Number((a + tax).toFixed(2));
    return {
      baseAmount: Number(a.toFixed(2)),
      taxAmount: Number(tax.toFixed(2)),
      vatAmount: Number(tax.toFixed(2)),
      finalAmount,
      totalWithVat: finalAmount,
    };
  } else {
    const base = a / (1 + rate / 100);
    const tax = a - base;
    return {
      baseAmount: Number(base.toFixed(2)),
      taxAmount: Number(tax.toFixed(2)),
      vatAmount: Number(tax.toFixed(2)),
      finalAmount: Number(a.toFixed(2)),
      totalWithVat: Number(a.toFixed(2)),
    };
  }
}

/**
 * Discount calculation with optional second discount.
 */
export function calculateDiscount(
  price: number,
  discountPercent: number,
  secondDiscountPercent = 0
): {
  originalPrice: number;
  firstDiscountAmount: number;
  discountAmount: number;
  afterFirstDiscount: number;
  secondDiscountAmount: number;
  finalPrice: number;
  totalSaved: number;
  effectiveDiscountRate: number;
} {
  const p = Math.max(0, price);
  const d1 = Math.max(0, Math.min(100, discountPercent));
  const d2 = Math.max(0, Math.min(100, secondDiscountPercent));

  const saved1 = (p * d1) / 100;
  const after1 = p - saved1;
  const saved2 = (after1 * d2) / 100;
  const finalPrice = Math.max(0, after1 - saved2);
  const totalSaved = saved1 + saved2;
  const effectiveRate = p > 0 ? (totalSaved / p) * 100 : 0;

  return {
    originalPrice: Number(p.toFixed(2)),
    firstDiscountAmount: Number(saved1.toFixed(2)),
    discountAmount: Number(saved1.toFixed(2)),
    afterFirstDiscount: Number(after1.toFixed(2)),
    secondDiscountAmount: Number(saved2.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
    totalSaved: Number(totalSaved.toFixed(2)),
    effectiveDiscountRate: Number(effectiveRate.toFixed(2)),
  };
}

/**
 * Profit / Margin solver.
 */
export function calculateMargin(costPrice: number, sellingPrice: number): {
  profit: number;
  marginPercent: number;
  markupPercent: number | null;
} {
  const cost = Math.max(0, costPrice);
  const price = Math.max(0, sellingPrice);
  const profit = price - cost;

  const margin = price > 0 ? (profit / price) * 100 : 0;
  const markup = cost > 0 ? (profit / cost) * 100 : null;

  return {
    profit: Number(profit.toFixed(2)),
    marginPercent: Number(margin.toFixed(2)),
    markupPercent: markup !== null ? Number(markup.toFixed(2)) : null,
  };
}

/**
 * Simple Interest with flexible time units (days, months, years).
 */
export function calculateSimpleInterest(
  principal: number,
  annualRate: number,
  timeValue: number,
  timeUnit: 'days' | 'months' | 'years' = 'years'
): {
  principal: number;
  interest: number;
  totalAmount: number;
  yearsFraction: number;
} {
  const p = Math.max(0, principal);
  const r = Math.max(0, annualRate);
  const t = Math.max(0, timeValue);

  let years = t;
  if (timeUnit === 'months') years = t / 12;
  else if (timeUnit === 'days') years = t / 365;

  const interest = (p * r * years) / 100;
  return {
    principal: Number(p.toFixed(2)),
    interest: Number(interest.toFixed(2)),
    totalAmount: Number((p + interest).toFixed(2)),
    yearsFraction: Number(years.toFixed(4)),
  };
}

/**
 * Compound Interest with compounding frequencies and recurring additions.
 */
export function calculateCompoundInterest(
  initialAmount: number,
  annualRate: number,
  years: number,
  compoundsPerYear: number = 4,
  monthlyContribution = 0
): {
  initialAmount: number;
  totalContributions: number;
  interestEarned: number;
  endingBalance: number;
  futureValue: number;
  yearlySchedule: { year: number; balance: number; contributions: number; interest: number }[];
} {
  const p0 = Math.max(0, initialAmount);
  const r = Math.max(0, annualRate) / 100;
  const y = Math.max(1, Math.min(100, years));
  const n = Math.max(1, compoundsPerYear);
  const pmt = Math.max(0, monthlyContribution);

  let balance = p0;
  let totalContrib = p0;
  const yearlySchedule = [];

  for (let year = 1; year <= y; year++) {
    const startBalance = balance;
    let yearContrib = 0;

    for (let month = 1; month <= 12; month++) {
      balance += pmt;
      yearContrib += pmt;
      totalContrib += pmt;
      // Compound per period
      balance *= Math.pow(1 + r / n, n / 12);
    }

    yearlySchedule.push({
      year,
      balance: Math.round(balance),
      contributions: Math.round(totalContrib),
      interest: Math.round(balance - totalContrib),
    });
  }

  const endingBalance = Number(balance.toFixed(2));
  const interestEarned = Number((balance - totalContrib).toFixed(2));

  return {
    initialAmount: p0,
    totalContributions: Math.round(totalContrib),
    interestEarned: Math.round(interestEarned),
    endingBalance: Math.round(endingBalance),
    futureValue: Math.round(endingBalance),
    yearlySchedule,
  };
}

/**
 * Savings goal calculator (mode: 'reach-target' or 'monthly-required').
 */
export function calculateSavingsGoal(
  target: number,
  arg2: number, // years or currentSavings
  arg3: number, // annualReturnPercent or monthlySavings
  arg4?: number, // initialDeposit or annualReturnPercent
  arg5?: 'timeline' | 'target-monthly',
  arg6?: number
): {
  monthsRequired: number;
  requiredMonthlySavings: number;
  monthlyContribution: number;
  totalContributions: number;
  totalDeposited: number;
  interestEarned: number;
} {
  // If 4 params passed (target, years, annualRate, initialDeposit)
  if (typeof arg5 === 'undefined') {
    const targetAmount = Math.max(0, target);
    const years = Math.max(0.1, arg2);
    const rate = Math.max(0, arg3) / 100 / 12;
    const initial = Math.max(0, arg4 ?? 0);
    const totalMonths = Math.round(years * 12);

    let monthlyNeeded = 0;
    if (rate === 0) {
      monthlyNeeded = Math.max(0, (targetAmount - initial) / totalMonths);
    } else {
      const futureValueOfInitial = initial * Math.pow(1 + rate, totalMonths);
      const remainingTarget = Math.max(0, targetAmount - futureValueOfInitial);
      const factor = (Math.pow(1 + rate, totalMonths) - 1) / rate;
      monthlyNeeded = factor > 0 ? remainingTarget / factor : 0;
    }

    const roundedMonthly = Math.round(monthlyNeeded);
    const totalDeposited = initial + roundedMonthly * totalMonths;
    const interest = Math.max(0, targetAmount - totalDeposited);

    return {
      monthsRequired: totalMonths,
      requiredMonthlySavings: roundedMonthly,
      monthlyContribution: roundedMonthly,
      totalContributions: totalDeposited,
      totalDeposited,
      interestEarned: interest,
    };
  }

  // 6 params mode
  const tgt = Math.max(0, target);
  const curr = Math.max(0, arg2);
  const r = Math.max(0, arg4 ?? 0) / 100 / 12;
  const mode = arg5;

  if (mode === 'target-monthly') {
    const m = Math.max(1, arg6 ?? 12);
    if (r === 0) {
      const needed = Math.max(0, (tgt - curr) / m);
      const totalContr = Number((curr + needed * m).toFixed(2));
      return {
        monthsRequired: m,
        requiredMonthlySavings: Number(needed.toFixed(2)),
        monthlyContribution: Number(needed.toFixed(2)),
        totalContributions: totalContr,
        totalDeposited: totalContr,
        interestEarned: 0,
      };
    }
    const factor = Math.pow(1 + r, m);
    const needed = (tgt - curr * factor) / ((factor - 1) / r);
    const safeNeeded = Math.max(0, needed);
    const totalContr = Number((curr + safeNeeded * m).toFixed(2));
    return {
      monthsRequired: m,
      requiredMonthlySavings: Number(safeNeeded.toFixed(2)),
      monthlyContribution: Number(safeNeeded.toFixed(2)),
      totalContributions: totalContr,
      totalDeposited: totalContr,
      interestEarned: Number((tgt - totalContr).toFixed(2)),
    };
  } else {
    const monthly = Math.max(1, arg3);
    let bal = curr;
    let months = 0;
    while (bal < tgt && months < 1200) {
      bal = (bal + monthly) * (1 + r);
      months++;
    }
    const totalContr = curr + monthly * months;
    return {
      monthsRequired: months,
      requiredMonthlySavings: monthly,
      monthlyContribution: monthly,
      totalContributions: Number(totalContr.toFixed(2)),
      totalDeposited: Number(totalContr.toFixed(2)),
      interestEarned: Number(Math.max(0, tgt - totalContr).toFixed(2)),
    };
  }
}
