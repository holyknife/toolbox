export interface TaxBracket {
  limit: number; // Bracket size (Infinity for top bracket)
  rate: number;  // Decimal rate (e.g. 0.01, 0.10)
  label: string;
}

export interface TaxFiscalYearConfig {
  fiscalYear: string;
  source: string;
  sourceUrl: string;
  lastVerified: string;
  individualBrackets: TaxBracket[];
  marriedBrackets: TaxBracket[];
  maxPfCitDeduction: number; // 300,000 or 500,000 with SSF
  maxPfCitRatio: number;     // 1/3 (0.333333333333)
  maxLifeInsuranceDeduction: number; // 40,000
  maxHealthInsuranceDeduction: number; // 20,000
}

export const NEPAL_TAX_CONFIGS: Record<string, TaxFiscalYearConfig> = {
  '2081-82': {
    fiscalYear: 'FY 2081/82 (2024/25)',
    source: 'Inland Revenue Department / Finance Act 2081',
    sourceUrl: 'https://ird.gov.np',
    lastVerified: '2026-04-15',
    individualBrackets: [
      { limit: 500000,  rate: 0.01, label: 'First Rs. 500,000 (SST 1%)' },
      { limit: 200000,  rate: 0.10, label: 'Next Rs. 200,000 (10%)' },
      { limit: 300000,  rate: 0.20, label: 'Next Rs. 300,000 (20%)' },
      { limit: 1000000, rate: 0.30, label: 'Next Rs. 1,000,000 (30%)' },
      { limit: 3000000, rate: 0.36, label: 'Next Rs. 3,000,000 (36%)' },
      { limit: Infinity, rate: 0.39, label: 'Above Rs. 5,000,000 (39%)' },
    ],
    marriedBrackets: [
      { limit: 600000,  rate: 0.01, label: 'First Rs. 600,000 (SST 1%)' },
      { limit: 200000,  rate: 0.10, label: 'Next Rs. 200,000 (10%)' },
      { limit: 300000,  rate: 0.20, label: 'Next Rs. 300,000 (20%)' },
      { limit: 900000,  rate: 0.30, label: 'Next Rs. 900,000 (30%)' },
      { limit: 3000000, rate: 0.36, label: 'Next Rs. 3,000,000 (36%)' },
      { limit: Infinity, rate: 0.39, label: 'Above Rs. 5,000,000 (39%)' },
    ],
    maxPfCitDeduction: 300000,
    maxPfCitRatio: 1 / 3,
    maxLifeInsuranceDeduction: 40000,
    maxHealthInsuranceDeduction: 20000,
  },
  '2080-81': {
    fiscalYear: 'FY 2080/81 (2023/24)',
    source: 'Inland Revenue Department / Finance Act 2080',
    sourceUrl: 'https://ird.gov.np',
    lastVerified: '2026-04-15',
    individualBrackets: [
      { limit: 500000,  rate: 0.01, label: 'First Rs. 500,000 (SST 1%)' },
      { limit: 200000,  rate: 0.10, label: 'Next Rs. 200,000 (10%)' },
      { limit: 300000,  rate: 0.20, label: 'Next Rs. 300,000 (20%)' },
      { limit: 1000000, rate: 0.30, label: 'Next Rs. 1,000,000 (30%)' },
      { limit: 3000000, rate: 0.36, label: 'Next Rs. 3,000,000 (36%)' },
      { limit: Infinity, rate: 0.39, label: 'Above Rs. 5,000,000 (39%)' },
    ],
    marriedBrackets: [
      { limit: 600000,  rate: 0.01, label: 'First Rs. 600,000 (SST 1%)' },
      { limit: 200000,  rate: 0.10, label: 'Next Rs. 200,000 (10%)' },
      { limit: 300000,  rate: 0.20, label: 'Next Rs. 300,000 (20%)' },
      { limit: 900000,  rate: 0.30, label: 'Next Rs. 900,000 (30%)' },
      { limit: 3000000, rate: 0.36, label: 'Next Rs. 3,000,000 (36%)' },
      { limit: Infinity, rate: 0.39, label: 'Above Rs. 5,000,000 (39%)' },
    ],
    maxPfCitDeduction: 300000,
    maxPfCitRatio: 1 / 3,
    maxLifeInsuranceDeduction: 40000,
    maxHealthInsuranceDeduction: 20000,
  },
};
