'use client';

import React, { useState, useMemo } from 'react';
import { calculateNepalSalaryTax } from '../../engines/tax-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField, { SelectField } from '../primitives/input-section';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import ExamplePresets from '../primitives/example-presets';
import { getCalculatorBySlug } from '../../registry/calculators-registry';

export default function NepalTaxView() {
  const calculator = getCalculatorBySlug('nepal-salary-tax')!;

  const [fiscalYear, setFiscalYear] = useState('2081-82');
  const [isMarried, setIsMarried] = useState(false);
  const [salaryMode, setSalaryMode] = useState<'monthly' | 'annual'>('monthly');
  const [salaryInput, setSalaryInput] = useState(75000); // 75,000 NPR monthly
  const [pfCitDeduction, setPfCitDeduction] = useState(100000); // PF/CIT annual
  const [lifeInsurance, setLifeInsurance] = useState(25000);
  const [healthInsurance, setHealthInsurance] = useState(10000);
  const [isSsf, setIsSsf] = useState(true);

  const annualSalary = salaryMode === 'monthly' ? salaryInput * 12 : salaryInput;

  const result = useMemo(() => {
    return calculateNepalSalaryTax({
      fiscalYear,
      isMarried,
      annualSalary,
      pfCitDeduction,
      lifeInsurancePremium: lifeInsurance,
      healthInsurancePremium: healthInsurance,
      isSsfContributor: isSsf,
    });
  }, [fiscalYear, isMarried, annualSalary, pfCitDeduction, lifeInsurance, healthInsurance, isSsf]);

  const takeHomeAnnual = annualSalary - result.annualTax;
  const takeHomeMonthly = Math.round(takeHomeAnnual / 12);

  const presets = [
    {
      label: 'Entry Level (Rs 35k/mo)',
      values: () => {
        setSalaryMode('monthly');
        setSalaryInput(35000);
        setPfCitDeduction(0);
      },
    },
    {
      label: 'Mid-Level (Rs 75k/mo + SSF)',
      values: () => {
        setSalaryMode('monthly');
        setSalaryInput(75000);
        setPfCitDeduction(120000);
        setIsSsf(true);
      },
    },
    {
      label: 'Senior (Rs 1.5L/mo + Married)',
      values: () => {
        setSalaryMode('monthly');
        setSalaryInput(150000);
        setIsMarried(true);
        setPfCitDeduction(300000);
        setLifeInsurance(40000);
        setIsSsf(true);
      },
    },
  ];

  const slabColumns: Column<any>[] = [
    { header: 'Bracket', accessor: 'label' },
    {
      header: 'Taxable In Slab',
      accessor: (r) => `Rs ${r.taxableAmount.toLocaleString()}`,
      align: 'right',
    },
    { header: 'Rate', accessor: (r) => `${r.rate}%`, align: 'center' },
    {
      header: 'Tax Payable',
      accessor: (r) => `Rs ${r.taxAmount.toLocaleString()}`,
      align: 'right',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-text m-0">Salary & Tax Profile</h2>
              <ExamplePresets
                presets={presets.map((p) => ({ label: p.label, values: p.values }))}
                onSelect={(fn) => fn()}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Fiscal Year"
                value={fiscalYear}
                onChange={setFiscalYear}
                options={[
                  { label: 'FY 2081/82 (Current Budget)', value: '2081-82' },
                  { label: 'FY 2080/81 (Previous Year)', value: '2080-81' },
                ]}
              />
              <SelectField
                label="Marital Status"
                value={isMarried ? 'married' : 'single'}
                onChange={(v) => setIsMarried(v === 'married')}
                options={[
                  { label: 'Individual (Unmarried)', value: 'single' },
                  { label: 'Couple (Married)', value: 'married' },
                ]}
              />
            </div>

            {/* Salary Entry */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text">Gross Earnings</span>
                <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => setSalaryMode('monthly')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      salaryMode === 'monthly' ? 'bg-card text-text shadow-xs font-bold' : 'text-text-dim'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalaryMode('annual')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      salaryMode === 'annual' ? 'bg-card text-text shadow-xs font-bold' : 'text-text-dim'
                    }`}
                  >
                    Annual
                  </button>
                </div>
              </div>

              <InputField
                label={salaryMode === 'monthly' ? 'Monthly Gross Salary (NPR)' : 'Annual Gross Salary (NPR)'}
                type="number"
                value={salaryInput}
                onChange={setSalaryInput}
                min={0}
                step={1000}
                unit="NPR"
              />
            </div>

            {/* Deductions */}
            <div className="border-t border-border/60 pt-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim m-0">
                Tax Deductions & Allowances
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="PF / CIT / SSF Contribution (Annual)"
                  type="number"
                  value={pfCitDeduction}
                  onChange={setPfCitDeduction}
                  min={0}
                  step={5000}
                  unit="NPR"
                  subtext="Max: 1/3 of salary or Rs 3,00,000"
                />
                <InputField
                  label="Life Insurance Premium (Annual)"
                  type="number"
                  value={lifeInsurance}
                  onChange={setLifeInsurance}
                  min={0}
                  step={1000}
                  unit="NPR"
                  subtext="Max allowable: Rs 40,000"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Health Insurance Premium (Annual)"
                  type="number"
                  value={healthInsurance}
                  onChange={setHealthInsurance}
                  min={0}
                  step={1000}
                  unit="NPR"
                  subtext="Max allowable: Rs 20,000"
                />

                <div className="flex items-center gap-2.5 pt-5">
                  <input
                    type="checkbox"
                    id="ssfToggle"
                    checked={isSsf}
                    onChange={(e) => setIsSsf(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-blue-600 cursor-pointer"
                  />
                  <label htmlFor="ssfToggle" className="text-xs text-text cursor-pointer select-none">
                    Contributing to SSF (Waives 1% SST on 1st bracket)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <FormulaExplanation
            title="Nepal Personal Income Tax (Section 1 Slabs)"
            notes={[
              'Individual Slab (FY 81/82): Up to Rs 5 Lakhs: 1% (0% if SSF), Next Rs 2 Lakhs: 10%, Next Rs 3 Lakhs: 20%, Next Rs 10 Lakhs: 30%, Above Rs 20 Lakhs to 50 Lakhs: 36%, Above Rs 50 Lakhs: 39%.',
              'Couple Slab (FY 81/82): Up to Rs 6 Lakhs: 1% (0% if SSF), Next Rs 2 Lakhs: 10%, Next Rs 3 Lakhs: 20%, Next Rs 9 Lakhs: 30%, Above Rs 20 Lakhs to 50 Lakhs: 36%, Above Rs 50 Lakhs: 39%.',
              'Section 63 Deduction: Retirement contributions to PF/CIT allowed up to 1/3 of taxable income or Rs 3,00,000, whichever is lower.',
            ]}
          />
          <SourceNotice
            source="Inland Revenue Department (IRD) Nepal & Finance Act 2081"
            updateDate="2026-04"
          />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Tax Liability"
            primaryValue={`Rs ${result.monthlyTax.toLocaleString()}`}
            primaryUnit="/ month"
            statusBadge={{
              label: `${result.effectiveTaxRate.toFixed(2)}% Effective Rate`,
              variant: result.effectiveTaxRate > 20 ? 'warning' : 'success',
            }}
            shareSummary={`Nepal Salary Tax (FY ${fiscalYear}): Monthly Tax Rs ${result.monthlyTax.toLocaleString()}, Annual Tax Rs ${result.annualTax.toLocaleString()} (${result.effectiveTaxRate.toFixed(2)}% effective)`}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Annual Tax"
                value={`Rs ${result.annualTax.toLocaleString()}`}
                highlight="danger"
              />
              <ResultMetric
                label="Monthly Take-Home"
                value={`Rs ${takeHomeMonthly.toLocaleString()}`}
                highlight="success"
              />
              <ResultMetric
                label="Net Taxable Income"
                value={`Rs ${result.netTaxableIncome.toLocaleString()}`}
                subtext={`Gross: Rs ${result.grossAnnualIncome.toLocaleString()}`}
              />
              <ResultMetric
                label="Total Deductions"
                value={`Rs ${result.totalDeductions.toLocaleString()}`}
              />
            </div>

            <div className="mt-5 space-y-2">
              <div className="text-xs font-semibold text-text">Bracket-by-Bracket Breakdown</div>
              <BreakdownTable columns={slabColumns} data={result.slabs} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
