'use client';

import React, { useState, useMemo } from 'react';
import { calculateBmi } from '../../engines/everyday-engine';
import { tip as calcTip } from '../../calculate';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import { calculators } from '../../registry/calculators-registry';

// 1. TIP CALCULATOR VIEW
export function TipView() {
  const calculator = calculators.find((c) => c.slug === 'tip')!;
  const [bill, setBill] = useState(2500);
  const [tipRate, setTipRate] = useState(10);
  const [people, setPeople] = useState(4);

  const result = useMemo(() => {
    return calcTip(bill, tipRate, people);
  }, [bill, tipRate, people]);

  const tipPresets = [5, 10, 15, 18, 20];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <InputField
              label="Total Bill Amount"
              type="number"
              value={bill}
              onChange={setBill}
              min={0}
              step="any"
            />

            <div>
              <InputField
                label="Tip Percentage (%)"
                type="number"
                value={tipRate}
                onChange={setTipRate}
                min={0}
                max={100}
                unit="%"
              />
              <div className="flex gap-1.5 mt-2">
                {tipPresets.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTipRate(pct)}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      tipRate === pct
                        ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-border text-text-dim hover:text-text'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <InputField
              label="Split Between (Number of People)"
              type="number"
              value={people}
              onChange={setPeople}
              min={1}
              max={100}
              unit="people"
            />
          </div>

          <FormulaExplanation
            title="Tip & Split Calculation"
            notes={[
              `Tip Amount = Bill Amount × (Tip % ÷ 100) = ${result.tip.toLocaleString()}`,
              `Total Bill = Bill + Tip = ${result.total.toLocaleString()}`,
              `Per Person Share = Total Bill ÷ Number of People = ${result.each.toLocaleString()}`,
            ]}
          />
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Per Person Share"
            primaryValue={`${result.each.toLocaleString()}`}
            primaryUnit="/ person"
            statusBadge={{ label: `${result.total.toLocaleString()} Total`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Total Bill" value={`${result.total.toLocaleString()}`} highlight="accent" />
              <ResultMetric label="Tip Amount" value={`${result.tip.toLocaleString()}`} />
              <ResultMetric label="Original Bill" value={`${bill.toLocaleString()}`} />
              <ResultMetric label="People" value={people} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 2. BMI CALCULATOR VIEW
export function BmiView() {
  const calculator = calculators.find((c) => c.slug === 'bmi')!;
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState(68); // kg
  const [height, setHeight] = useState(172); // cm

  const result = useMemo(() => {
    const wKg = unit === 'metric' ? weight : weight * 0.453592;
    const hM = unit === 'metric' ? height / 100 : height * 0.0254;
    return calculateBmi(wKg, hM);
  }, [unit, weight, height]);

  // Healthy weight range for this height
  const hM = unit === 'metric' ? height / 100 : height * 0.0254;
  const minHealthyKg = (18.5 * (hM * hM)).toFixed(1);
  const maxHealthyKg = (24.9 * (hM * hM)).toFixed(1);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex gap-2 p-1.5 rounded-xl bg-muted/40 border border-border">
            <button
              type="button"
              onClick={() => setUnit('metric')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg ${
                unit === 'metric' ? 'bg-card text-text shadow-xs font-bold' : 'text-text-dim'
              }`}
            >
              Metric (kg / cm)
            </button>
            <button
              type="button"
              onClick={() => setUnit('imperial')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg ${
                unit === 'imperial' ? 'bg-card text-text shadow-xs font-bold' : 'text-text-dim'
              }`}
            >
              Imperial (lb / inches)
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label={unit === 'metric' ? 'Weight (kg)' : 'Weight (lbs)'}
                type="number"
                value={weight}
                onChange={setWeight}
                min={1}
                step="any"
              />
              <InputField
                label={unit === 'metric' ? 'Height (cm)' : 'Height (inches)'}
                type="number"
                value={height}
                onChange={setHeight}
                min={1}
                step="any"
              />
            </div>
          </div>

          <FormulaExplanation
            title="WHO Body Mass Index Categories"
            notes={[
              'Underweight: BMI < 18.5',
              'Normal / Healthy weight: 18.5 – 24.9',
              'Overweight: 25.0 – 29.9',
              'Obesity: BMI ≥ 30.0',
            ]}
          />
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Body Mass Index"
            primaryValue={result.bmi.toFixed(1)}
            primaryUnit="BMI"
            statusBadge={{
              label: result.category,
              variant:
                result.category === 'Normal weight'
                  ? 'success'
                  : result.category.includes('Obese')
                  ? 'danger'
                  : 'warning',
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Category"
                value={result.category}
                highlight={result.category === 'Normal weight' ? 'success' : 'warning'}
              />
              <ResultMetric label="Healthy Range" value="18.5 – 24.9" />
              <ResultMetric
                label="Healthy Weight"
                value={`${minHealthyKg} – ${maxHealthyKg}`}
                unit="kg"
              />
              <ResultMetric
                label="Height"
                value={unit === 'metric' ? `${height} cm` : `${height} in`}
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
