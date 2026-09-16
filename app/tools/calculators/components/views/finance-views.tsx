'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateEmi,
  calculateVat,
  calculateDiscount,
  calculateMargin,
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateSavingsGoal,
} from '../../engines/finance-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField, { SelectField } from '../primitives/input-section';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators, getCalculatorBySlug } from '../../registry/calculators-registry';

// 1. LOAN / EMI CALCULATOR
export function LoanEmiView() {
  const calculator = calculators.find((c) => c.slug === 'loan-emi')!;
  const [principal, setPrincipal] = useState(2500000); // 25 Lakhs
  const [rate, setRate] = useState(11.5); // 11.5% typical commercial bank rate
  const [years, setYears] = useState(10);
  const [showSchedule, setShowSchedule] = useState(false);

  const tenureMonths = years * 12;
  const result = useMemo(() => {
    return calculateEmi(principal, rate, tenureMonths);
  }, [principal, rate, tenureMonths]);

  const scheduleColumns: Column<any>[] = [
    { header: 'Mo', accessor: 'month', align: 'center' },
    { header: 'Principal', accessor: (r) => `Rs ${r.principalPart.toLocaleString()}`, align: 'right' },
    { header: 'Interest', accessor: (r) => `Rs ${r.interestPart.toLocaleString()}`, align: 'right' },
    { header: 'Balance', accessor: (r) => `Rs ${r.balance.toLocaleString()}`, align: 'right' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Loan Parameters</h2>
            <InputField label="Loan Amount (NPR)" type="number" value={principal} onChange={setPrincipal} min={1000} step={50000} unit="NPR" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Annual Interest Rate (%)" type="number" value={rate} onChange={setRate} min={0.1} max={50} step={0.1} unit="%" />
              <InputField label="Tenure (Years)" type="number" value={years} onChange={setYears} min={1} max={30} unit="years" subtext={`${tenureMonths} monthly payments`} />
            </div>
          </div>
          <FormulaExplanation
            title="Standard Reducing Balance EMI Formula"
            formula="EMI = [P × r × (1 + r)^n] / [(1 + r)^n − 1]"
            notes={[
              'P = Principal loan amount, r = Monthly interest rate (Annual % / 12 / 100), n = Loan tenure in months.',
              'Standard reducing balance formula adopted by Nepal Rastra Bank (NRB) class A, B, and C financial institutions.',
            ]}
          />
          <SourceNotice source="Nepal Rastra Bank (NRB) Retail Lending Guidelines" />
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Monthly EMI"
            primaryValue={`Rs ${result.emi.toLocaleString()}`}
            primaryUnit="/ month"
            statusBadge={{ label: `${years} Years Tenure`, variant: 'success' }}
            shareSummary={`Loan EMI: Rs ${result.emi.toLocaleString()}/mo for Rs ${principal.toLocaleString()} at ${rate}% for ${years} years. Total Repayment: Rs ${result.totalPayment.toLocaleString()}`}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Total Interest" value={`Rs ${result.totalInterest.toLocaleString()}`} highlight="warning" />
              <ResultMetric label="Total Repayment" value={`Rs ${result.totalPayment.toLocaleString()}`} highlight="accent" />
              <ResultMetric label="Principal" value={`Rs ${principal.toLocaleString()}`} />
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

// 2. VAT CALCULATOR
export function VatView() {
  const calculator = getCalculatorBySlug('vat-tax')!;
  const [baseAmount, setBaseAmount] = useState(10000);
  const [vatRate, setVatRate] = useState(13); // Nepal standard 13%
  const result = useMemo(() => calculateVat(baseAmount, vatRate), [baseAmount, vatRate]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">VAT Inputs</h2>
            <InputField label="Amount Before VAT (NPR)" type="number" value={baseAmount} onChange={setBaseAmount} min={0} step={100} unit="NPR" />
            <InputField label="VAT Rate (%)" type="number" value={vatRate} onChange={setVatRate} min={0} max={100} step={0.5} unit="%" subtext="Nepal statutory VAT rate is 13%" />
          </div>
          <FormulaExplanation title="Value Added Tax (VAT) Calculation" notes={['Nepal Value Added Tax Act 2052 levies a flat 13% rate on taxable goods and services.', 'Total with VAT = Base Amount + (Base Amount × 13 / 100).']} />
          <SourceNotice source="Inland Revenue Department (IRD) Nepal VAT Act 2052" />
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Total with VAT"
            primaryValue={`Rs ${result.totalWithVat.toLocaleString()}`}
            primaryUnit="Total"
            statusBadge={{ label: `${vatRate}% VAT Included`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="VAT Amount" value={`Rs ${result.vatAmount.toLocaleString()}`} highlight="accent" />
              <ResultMetric label="Base Price" value={`Rs ${baseAmount.toLocaleString()}`} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 3. DISCOUNT CALCULATOR
export function DiscountView() {
  const calculator = calculators.find((c) => c.slug === 'discount')!;
  const [price, setPrice] = useState(2500);
  const [rate, setRate] = useState(20);
  const result = useMemo(() => calculateDiscount(price, rate), [price, rate]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Discount Details</h2>
            <InputField label="Original Price (NPR)" type="number" value={price} onChange={setPrice} min={0} unit="NPR" />
            <InputField label="Discount Percentage (%)" type="number" value={rate} onChange={setRate} min={0} max={100} unit="%" />
          </div>
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Discounted Price"
            primaryValue={`Rs ${result.finalPrice.toLocaleString()}`}
            primaryUnit="Payable"
            statusBadge={{ label: `Saved ${rate}%`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="You Save" value={`Rs ${result.discountAmount.toLocaleString()}`} highlight="success" />
              <ResultMetric label="Original" value={`Rs ${price.toLocaleString()}`} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 4. PROFIT MARGIN CALCULATOR
export function ProfitMarginView() {
  const calculator = calculators.find((c) => c.slug === 'profit-margin')!;
  const [cost, setCost] = useState(800);
  const [sellingPrice, setSellingPrice] = useState(1200);
  const result = useMemo(() => calculateMargin(cost, sellingPrice), [cost, sellingPrice]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Cost & Selling Price</h2>
            <InputField label="Cost of Goods (NPR)" type="number" value={cost} onChange={setCost} min={0} unit="NPR" />
            <InputField label="Selling Price (NPR)" type="number" value={sellingPrice} onChange={setSellingPrice} min={0} unit="NPR" />
          </div>
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Net Profit"
            primaryValue={`Rs ${result.profit.toLocaleString()}`}
            primaryUnit=""
            statusBadge={{ label: `${result.marginPercent.toFixed(1)}% Margin`, variant: result.profit >= 0 ? 'success' : 'danger' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Profit Margin" value={`${result.marginPercent.toFixed(1)}%`} highlight={result.profit >= 0 ? 'success' : 'danger'} />
              <ResultMetric
                label="Markup on Cost"
                value={result.markupPercent !== null ? `${result.markupPercent.toFixed(1)}%` : 'N/A'}
                highlight="accent"
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 5. SIMPLE INTEREST CALCULATOR
export function SimpleInterestView() {
  const calculator = calculators.find((c) => c.slug === 'simple-interest')!;
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(3);
  const result = useMemo(() => calculateSimpleInterest(principal, rate, years), [principal, rate, years]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <InputField label="Principal (NPR)" type="number" value={principal} onChange={setPrincipal} min={0} unit="NPR" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Annual Rate (%)" type="number" value={rate} onChange={setRate} min={0} step={0.1} unit="%" />
              <InputField label="Time (Years)" type="number" value={years} onChange={setYears} min={0.1} step={0.5} unit="years" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Maturity Amount"
            primaryValue={`Rs ${result.totalAmount.toLocaleString()}`}
            primaryUnit="Total"
            statusBadge={{ label: `${years} Years`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Interest Earned" value={`Rs ${result.interest.toLocaleString()}`} highlight="accent" />
              <ResultMetric label="Initial Principal" value={`Rs ${principal.toLocaleString()}`} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 6. COMPOUND INTEREST CALCULATOR
export function CompoundInterestView() {
  const calculator = calculators.find((c) => c.slug === 'compound-interest')!;
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(5);
  const [freq, setFreq] = useState(4); // Quarterly standard for Nepal fixed deposits

  const result = useMemo(() => calculateCompoundInterest(principal, rate, years, freq), [principal, rate, years, freq]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <InputField label="Principal Amount (NPR)" type="number" value={principal} onChange={setPrincipal} min={0} unit="NPR" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Annual Interest (%)" type="number" value={rate} onChange={setRate} min={0} step={0.1} unit="%" />
              <InputField label="Duration (Years)" type="number" value={years} onChange={setYears} min={1} max={50} unit="years" />
            </div>
            <SelectField
              label="Compounding Frequency"
              value={freq.toString()}
              onChange={(v) => setFreq(parseInt(v))}
              options={[
                { label: 'Quarterly (Every 3 months - Standard in Nepal Banks)', value: '4' },
                { label: 'Monthly (Every month)', value: '12' },
                { label: 'Semi-Annually (Every 6 months)', value: '2' },
                { label: 'Annually (Once a year)', value: '1' },
              ]}
            />
          </div>
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Future Maturity Value"
            primaryValue={`Rs ${result.futureValue.toLocaleString()}`}
            primaryUnit="Total"
            statusBadge={{ label: `${years} Years Compounding`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Interest Earned" value={`Rs ${result.interestEarned.toLocaleString()}`} highlight="accent" />
              <ResultMetric label="Initial Deposit" value={`Rs ${principal.toLocaleString()}`} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 7. SAVINGS GOAL CALCULATOR
export function SavingsGoalView() {
  const calculator = calculators.find((c) => c.slug === 'savings-goal')!;
  const [target, setTarget] = useState(1000000); // 10 Lakhs
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(8);
  const [initial, setInitial] = useState(50000);

  const result = useMemo(() => calculateSavingsGoal(target, years, rate, initial), [target, years, rate, initial]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <InputField label="Target Savings Goal (NPR)" type="number" value={target} onChange={setTarget} min={1000} step={50000} unit="NPR" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InputField label="Time (Years)" type="number" value={years} onChange={setYears} min={1} max={40} unit="years" />
              <InputField label="Expected Return (%)" type="number" value={rate} onChange={setRate} min={0} step={0.5} unit="%" />
              <InputField label="Initial Deposit (NPR)" type="number" value={initial} onChange={setInitial} min={0} unit="NPR" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Monthly Contribution Needed"
            primaryValue={`Rs ${result.monthlyContribution.toLocaleString()}`}
            primaryUnit="/ month"
            statusBadge={{ label: `Reach Rs ${target.toLocaleString()}`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Total You Deposit" value={`Rs ${result.totalDeposited.toLocaleString()}`} />
              <ResultMetric label="Interest Growth" value={`Rs ${result.interestEarned.toLocaleString()}`} highlight="accent" />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
