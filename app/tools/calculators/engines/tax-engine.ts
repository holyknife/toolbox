import { NEPAL_TAX_CONFIGS, type TaxFiscalYearConfig } from '../config/nepal-tax-rules';

export interface TaxInput {
  fiscalYear: string;
  isMarried: boolean;
  annualSalary: number; // Gross salary per year
  pfCitDeduction: number; // Employee Provident Fund / CIT / SSF
  lifeInsurancePremium: number;
  healthInsurancePremium: number;
  isSsfContributor?: boolean; // If contributing to Social Security Fund, 1% SST is waived
}

export interface TaxSlabBreakdown {
  label: string;
  taxableAmount: number;
  rate: number;
  taxAmount: number;
}

export interface TaxCalculationResult {
  fiscalYear: string;
  grossAnnualIncome: number;
  totalDeductions: number;
  netTaxableIncome: number;
  annualTax: number;
  monthlyTax: number;
  effectiveTaxRate: number;
  slabs: TaxSlabBreakdown[];
  deductionBreakdown: {
    pfCitAllowed: number;
    lifeInsuranceAllowed: number;
    healthInsuranceAllowed: number;
  };
  metadata: {
    source: string;
    sourceUrl: string;
    lastVerified: string;
  };
}

export function calculateNepalSalaryTax(input: TaxInput): TaxCalculationResult {
  const config: TaxFiscalYearConfig = NEPAL_TAX_CONFIGS[input.fiscalYear] ?? NEPAL_TAX_CONFIGS['2081-82'];
  const gross = Math.max(0, input.annualSalary);

  // 1. Calculate Allowable Deductions
  const maxPfAllowed = Math.min(
    gross * config.maxPfCitRatio,
    config.maxPfCitDeduction
  );
  const pfCitAllowed = Math.min(Math.max(0, input.pfCitDeduction), maxPfAllowed);
  const lifeInsuranceAllowed = Math.min(
    Math.max(0, input.lifeInsurancePremium),
    config.maxLifeInsuranceDeduction
  );
  const healthInsuranceAllowed = Math.min(
    Math.max(0, input.healthInsurancePremium),
    config.maxHealthInsuranceDeduction
  );

  const totalDeductions = pfCitAllowed + lifeInsuranceAllowed + healthInsuranceAllowed;
  const netTaxableIncome = Math.max(0, gross - totalDeductions);

  // 2. Bracket-by-Bracket Calculation
  const brackets = input.isMarried ? config.marriedBrackets : config.individualBrackets;
  let remainingTaxable = netTaxableIncome;
  let annualTax = 0;
  const slabs: TaxSlabBreakdown[] = [];

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    if (remainingTaxable <= 0) break;

    const amountInBracket = Math.min(remainingTaxable, bracket.limit);
    let rate = bracket.rate;

    // Under Finance Act rules: If contributing to SSF, the 1% SST on first bracket is exempt
    if (i === 0 && input.isSsfContributor && rate === 0.01) {
      rate = 0;
    }

    const slabTax = amountInBracket * rate;
    annualTax += slabTax;
    slabs.push({
      label: bracket.label,
      taxableAmount: Math.round(amountInBracket),
      rate: bracket.rate,
      taxAmount: Math.round(slabTax),
    });

    remainingTaxable -= amountInBracket;
  }

  const roundedAnnualTax = Math.round(annualTax);
  const monthlyTax = Math.round(roundedAnnualTax / 12);
  const effectiveTaxRate = gross > 0 ? Number(((roundedAnnualTax / gross) * 100).toFixed(2)) : 0;

  return {
    fiscalYear: config.fiscalYear,
    grossAnnualIncome: Math.round(gross),
    totalDeductions: Math.round(totalDeductions),
    netTaxableIncome: Math.round(netTaxableIncome),
    annualTax: roundedAnnualTax,
    monthlyTax,
    effectiveTaxRate,
    slabs,
    deductionBreakdown: {
      pfCitAllowed: Math.round(pfCitAllowed),
      lifeInsuranceAllowed: Math.round(lifeInsuranceAllowed),
      healthInsuranceAllowed: Math.round(healthInsuranceAllowed),
    },
    metadata: {
      source: config.source,
      sourceUrl: config.sourceUrl,
      lastVerified: config.lastVerified,
    },
  };
}
