'use client';

import React, { useState, useMemo } from 'react';
import { calculateEmi, calculateDiscount } from '../../engines/finance-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import FormulaExplanation from '../primitives/formula-explanation';
import { calculators } from '../../registry/calculators-registry';

// 1. LOAN / EMI CALCULATOR
export function LoanEmiView() {
  const calculator = calculators.find((c) => c.slug === 'loan-emi')!;
  const [principal, setPrincipal] = useState(2500000); // 25 Lakhs
  const [rate, setRate] = useState(10.5);
  const [years, setYears] = useState(10);
  const [showSchedule, setShowSchedule] = useState(false);

  const tenureMonths = years * 12;
  const result = useMemo(() => {
    return calculateEmi(principal, rate, tenureMonths);
  }, [principal, rate, tenureMonths]);

  const scheduleColumns: Column<any>[] = [
    { header: 'Mo', accessor: 'month', align: 'center' },
    { header: 'Principal', accessor: (r) => `${r.principalPart.toLocaleString()}`, align: 'right' },
    { header: 'Interest', accessor: (r) => `${r.interestPart.toLocaleString()}`, align: 'right' },
    { header: 'Balance', accessor: (r) => `${r.balance.toLocaleString()}`, align: 'right' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Loan Parameters</h2>
            <InputField
              label="Loan Amount (Principal)"
              type="number"
              value={principal}
              onChange={setPrincipal}
              min={1000}
              step={10000}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Annual Interest Rate (%)"
                type="number"
                value={rate}
                onChange={setRate}
                min={0.1}
                max={50}
                step={0.1}
                unit="%"
              />
              <InputField
                label="Tenure (Years)"
                type="number"
                value={years}
                onChange={setYears}
                min={1}
                max={30}
                unit="years"
                subtext={`${tenureMonths} monthly installments`}
              />
            </div>
          </div>

          <FormulaExplanation
            title="Standard Reducing Balance EMI Formula"
            formula="EMI = [P × r × (1 + r)^n] / [(1 + r)^n − 1]"
            notes={[
              'P = Principal loan amount, r = Monthly interest rate (Annual % ÷ 12 ÷ 100), n = Loan tenure in months.',
              'Standard reducing balance amortization formula used by banks and financial institutions worldwide.',
            ]}
          />
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Monthly EMI"
            primaryValue={`${result.emi.toLocaleString()}`}
            primaryUnit="/ month"
            statusBadge={{ label: `${years} Years Tenure`, variant: 'success' }}
            shareSummary={`Loan EMI: ${result.emi.toLocaleString()}/mo for loan of ${principal.toLocaleString()} at ${rate}% for ${years} years. Total Repayment: ${result.totalPayment.toLocaleString()}`}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Total Interest" value={`${result.totalInterest.toLocaleString()}`} highlight="warning" />
              <ResultMetric label="Total Repayment" value={`${result.totalPayment.toLocaleString()}`} highlight="accent" />
              <ResultMetric label="Principal" value={`${principal.toLocaleString()}`} />
              <ResultMetric label="Interest Ratio" value={`${((result.totalInterest / result.totalPayment) * 100).toFixed(1)}%`} />
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowSchedule(!showSchedule)}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-text transition-colors"
              >
                {showSchedule ? 'Hide Amortization Schedule' : 'View First 24 Months Schedule'}
              </button>
              {showSchedule && (
                <div className="mt-3 max-h-72 overflow-y-auto">
                  <BreakdownTable columns={scheduleColumns} data={result.schedule.slice(0, 24)} />
                </div>
              )}
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 2. DISCOUNT CALCULATOR
export function DiscountView() {
  const calculator = calculators.find((c) => c.slug === 'discount')!;
  const [price, setPrice] = useState(2500);
  const [rate, setRate] = useState(20);
  const result = useMemo(() => calculateDiscount(price, rate), [price, rate]);

  const discountPresets = [5, 10, 15, 20, 25, 30, 40, 50];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Discount Details</h2>
            <InputField
              label="Original Price"
              type="number"
              value={price}
              onChange={setPrice}
              min={0}
              step="any"
            />
            <div>
              <InputField
                label="Discount Percentage (%)"
                type="number"
                value={rate}
                onChange={setRate}
                min={0}
                max={100}
                unit="%"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {discountPresets.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRate(pct)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      rate === pct
                        ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                        : 'border-border text-text-dim hover:text-text'
                    }`}
                  >
                    {pct}% off
                  </button>
                ))}
              </div>
            </div>
          </div>

          <FormulaExplanation
            title="Discount Formula"
            notes={[
              `Amount Saved = Original Price × (Discount % ÷ 100) = ${result.discountAmount.toLocaleString()}`,
              `Final Sale Price = Original Price − Amount Saved = ${result.finalPrice.toLocaleString()}`,
            ]}
          />
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Discounted Sale Price"
            primaryValue={`${result.finalPrice.toLocaleString()}`}
            primaryUnit="Payable"
            statusBadge={{ label: `Saved ${rate}%`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="You Save" value={`${result.discountAmount.toLocaleString()}`} highlight="success" />
              <ResultMetric label="Original Price" value={`${price.toLocaleString()}`} />
              <ResultMetric label="Discount Rate" value={`${rate}%`} />
              <ResultMetric label="Payable Ratio" value={`${100 - rate}%`} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
