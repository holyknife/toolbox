'use client';

import React, { useState, useMemo } from 'react';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import { getCalculatorBySlug } from '../../registry/calculators-registry';

export default function PercentageView() {
  const calculator = getCalculatorBySlug('percentage')!;

  // 4 Modes
  const [activeTab, setActiveTab] = useState<'of' | 'isWhat' | 'change' | 'addSubtract'>('of');

  // Mode 1: What is X% of Y?
  const [percent1, setPercent1] = useState(15);
  const [value1, setValue1] = useState(250);

  // Mode 2: X is what % of Y?
  const [part2, setPart2] = useState(45);
  const [whole2, setWhole2] = useState(180);

  // Mode 3: Percentage Change from X to Y
  const [initial3, setInitial3] = useState(80);
  const [final3, setFinal3] = useState(100);

  // Mode 4: Add / Subtract %
  const [base4, setBase4] = useState(150);
  const [percent4, setPercent4] = useState(13);
  const [operation4, setOperation4] = useState<'add' | 'subtract'>('add');

  // Calculations
  const result1 = useMemo(() => {
    const p = Number(percent1) || 0;
    const v = Number(value1) || 0;
    const ans = (p / 100) * v;
    return {
      value: ans,
      formatted: Number.isInteger(ans) ? ans.toString() : ans.toFixed(2),
    };
  }, [percent1, value1]);

  const result2 = useMemo(() => {
    const part = Number(part2) || 0;
    const whole = Number(whole2) || 0;
    if (whole === 0) return { value: 0, formatted: '0%' };
    const ans = (part / whole) * 100;
    return {
      value: ans,
      formatted: `${Number.isInteger(ans) ? ans : ans.toFixed(2)}%`,
    };
  }, [part2, whole2]);

  const result3 = useMemo(() => {
    const init = Number(initial3) || 0;
    const fin = Number(final3) || 0;
    if (init === 0) return { change: 0, formatted: '0%', isIncrease: true, diff: 0 };
    const diff = fin - init;
    const change = (diff / Math.abs(init)) * 100;
    return {
      change,
      diff,
      isIncrease: diff >= 0,
      formatted: `${diff >= 0 ? '+' : ''}${change.toFixed(2)}%`,
    };
  }, [initial3, final3]);

  const result4 = useMemo(() => {
    const base = Number(base4) || 0;
    const pct = Number(percent4) || 0;
    const delta = (pct / 100) * base;
    const total = operation4 === 'add' ? base + delta : base - delta;
    return {
      delta,
      total,
      formatted: Number.isInteger(total) ? total.toString() : total.toFixed(2),
      deltaFormatted: Number.isInteger(delta) ? delta.toString() : delta.toFixed(2),
    };
  }, [base4, percent4, operation4]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-xl bg-muted/40 border border-border">
            <button
              type="button"
              onClick={() => setActiveTab('of')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                activeTab === 'of' ? 'bg-card text-text shadow-xs' : 'text-text-dim hover:text-text'
              }`}
            >
              What is X% of Y?
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('isWhat')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                activeTab === 'isWhat' ? 'bg-card text-text shadow-xs' : 'text-text-dim hover:text-text'
              }`}
            >
              X is what % of Y?
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('change')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                activeTab === 'change' ? 'bg-card text-text shadow-xs' : 'text-text-dim hover:text-text'
              }`}
            >
              % Change
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('addSubtract')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center ${
                activeTab === 'addSubtract' ? 'bg-card text-text shadow-xs' : 'text-text-dim hover:text-text'
              }`}
            >
              Add / Subtract %
            </button>
          </div>

          {/* Tab 1: What is X% of Y? */}
          {activeTab === 'of' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-text m-0">What is X% of Y?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Percentage (%)"
                  type="number"
                  value={percent1}
                  onChange={setPercent1}
                  step="any"
                  unit="%"
                />
                <InputField
                  label="Of Number (Y)"
                  type="number"
                  value={value1}
                  onChange={setValue1}
                  step="any"
                />
              </div>
            </div>
          )}

          {/* Tab 2: X is what % of Y? */}
          {activeTab === 'isWhat' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-text m-0">X is what % of Y?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Value (X)"
                  type="number"
                  value={part2}
                  onChange={setPart2}
                  step="any"
                />
                <InputField
                  label="Total (Y)"
                  type="number"
                  value={whole2}
                  onChange={setWhole2}
                  step="any"
                />
              </div>
            </div>
          )}

          {/* Tab 3: % Change */}
          {activeTab === 'change' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-text m-0">Percentage Increase or Decrease</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Initial Value (From)"
                  type="number"
                  value={initial3}
                  onChange={setInitial3}
                  step="any"
                />
                <InputField
                  label="Final Value (To)"
                  type="number"
                  value={final3}
                  onChange={setFinal3}
                  step="any"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Add or Subtract % */}
          {activeTab === 'addSubtract' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-text m-0">Add or Subtract a Percentage</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Base Amount"
                  type="number"
                  value={base4}
                  onChange={setBase4}
                  step="any"
                />
                <InputField
                  label="Percentage (%)"
                  type="number"
                  value={percent4}
                  onChange={setPercent4}
                  step="any"
                  unit="%"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOperation4('add')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    operation4 === 'add'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-border text-text-dim hover:text-text'
                  }`}
                >
                  + Add {percent4}%
                </button>
                <button
                  type="button"
                  onClick={() => setOperation4('subtract')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    operation4 === 'subtract'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                      : 'border-border text-text-dim hover:text-text'
                  }`}
                >
                  − Subtract {percent4}%
                </button>
              </div>
            </div>
          )}

          <FormulaExplanation
            title="Formula & Quick Rules"
            notes={[
              activeTab === 'of'
                ? `${percent1}% of ${value1} = (${percent1} ÷ 100) × ${value1} = ${result1.formatted}`
                : activeTab === 'isWhat'
                ? `(${part2} ÷ ${whole2}) × 100 = ${result2.formatted}`
                : activeTab === 'change'
                ? `((${final3} − ${initial3}) ÷ |${initial3}|) × 100 = ${result3.formatted}`
                : `${base4} ${operation4 === 'add' ? '+' : '−'} ${percent4}% (${result4.deltaFormatted}) = ${result4.formatted}`,
              'Percentages express fractions out of 100 and work with any decimal or negative numbers.',
            ]}
          />
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          {activeTab === 'of' && (
            <ResultPanel
              title="Calculated Result"
              primaryValue={result1.formatted}
              primaryUnit={`(${percent1}% of ${value1})`}
              statusBadge={{ label: `${percent1}%`, variant: 'accent' }}
            >
              <div className="grid grid-cols-2 gap-2 mt-4">
                <ResultMetric label="Percentage" value={`${percent1}%`} />
                <ResultMetric label="Base Number" value={value1} />
                <ResultMetric label="Fraction" value={`${percent1}/100`} />
                <ResultMetric label="Decimal Multiplier" value={(percent1 / 100).toFixed(4)} />
              </div>
            </ResultPanel>
          )}

          {activeTab === 'isWhat' && (
            <ResultPanel
              title="Percentage"
              primaryValue={result2.formatted}
              primaryUnit={`(${part2} of ${whole2})`}
              statusBadge={{ label: `${part2} / ${whole2}`, variant: 'accent' }}
            >
              <div className="grid grid-cols-2 gap-2 mt-4">
                <ResultMetric label="Part" value={part2} />
                <ResultMetric label="Total (Whole)" value={whole2} />
                <ResultMetric label="Decimal" value={(whole2 ? part2 / whole2 : 0).toFixed(4)} />
                <ResultMetric label="Remaining" value={`${whole2 ? ((1 - part2 / whole2) * 100).toFixed(1) : 0}%`} />
              </div>
            </ResultPanel>
          )}

          {activeTab === 'change' && (
            <ResultPanel
              title="Percentage Change"
              primaryValue={result3.formatted}
              primaryUnit={result3.isIncrease ? 'Increase' : 'Decrease'}
              statusBadge={{
                label: result3.isIncrease ? '📈 Up' : '📉 Down',
                variant: result3.isIncrease ? 'success' : 'warning',
              }}
            >
              <div className="grid grid-cols-2 gap-2 mt-4">
                <ResultMetric label="Absolute Difference" value={`${result3.diff >= 0 ? '+' : ''}${result3.diff.toFixed(2)}`} highlight={result3.isIncrease ? 'success' : 'warning'} />
                <ResultMetric label="Direction" value={result3.isIncrease ? 'Increase' : 'Decrease'} />
                <ResultMetric label="Initial (From)" value={initial3} />
                <ResultMetric label="Final (To)" value={final3} />
              </div>
            </ResultPanel>
          )}

          {activeTab === 'addSubtract' && (
            <ResultPanel
              title="Final Total"
              primaryValue={result4.formatted}
              primaryUnit={operation4 === 'add' ? `+${percent4}%` : `−${percent4}%`}
              statusBadge={{
                label: operation4 === 'add' ? `Added ${result4.deltaFormatted}` : `Deducted ${result4.deltaFormatted}`,
                variant: operation4 === 'add' ? 'accent' : 'success',
              }}
            >
              <div className="grid grid-cols-2 gap-2 mt-4">
                <ResultMetric label="Percentage Amount" value={result4.deltaFormatted} highlight="accent" />
                <ResultMetric label="Original Base" value={base4} />
                <ResultMetric label="Percentage" value={`${percent4}%`} />
                <ResultMetric label="Operation" value={operation4 === 'add' ? 'Addition' : 'Subtraction'} />
              </div>
            </ResultPanel>
          )}
        </div>
      </div>
    </div>
  );
}
