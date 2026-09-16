'use client';

import React, { useState, useMemo } from 'react';
import { calculateGold } from '../../engines/everyday-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField, { SelectField } from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import ExamplePresets from '../primitives/example-presets';
import { getCalculatorBySlug } from '../../registry/calculators-registry';

export default function TolaGoldView() {
  const calculator = getCalculatorBySlug('tola-gold-converter')!;

  const [weightValue, setWeightValue] = useState(1);
  const [unit, setUnit] = useState<'tola' | 'gram' | 'kg'>('tola');
  const [ratePerTola, setRatePerTola] = useState(160000); // NPR per tola (approx current market)
  const [makingCharge, setMakingCharge] = useState(4000);
  const [otherCharge, setOtherCharge] = useState(0);

  const result = useMemo(() => {
    return calculateGold(
      Number(weightValue) || 0,
      unit,
      Number(ratePerTola) || 0,
      Number(makingCharge) || 0,
      Number(otherCharge) || 0
    );
  }, [weightValue, unit, ratePerTola, makingCharge, otherCharge]);

  const presets = [
    {
      label: '1 Tola Bar',
      values: () => {
        setUnit('tola');
        setWeightValue(1);
        setMakingCharge(0);
      },
    },
    {
      label: 'Wedding Ring (4 Grams)',
      values: () => {
        setUnit('gram');
        setWeightValue(4);
        setMakingCharge(2500);
      },
    },
    {
      label: 'Necklace (2.5 Tola)',
      values: () => {
        setUnit('tola');
        setWeightValue(2.5);
        setMakingCharge(12000);
      },
    },
    {
      label: '10 Tola (Biskut)',
      values: () => {
        setUnit('tola');
        setWeightValue(10);
        setMakingCharge(0);
      },
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-text m-0">Gold Weight & Price</h2>
              <ExamplePresets
                presets={presets.map((p) => ({ label: p.label, values: p.values }))}
                onSelect={(fn) => fn()}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Weight Value"
                type="number"
                value={weightValue}
                onChange={setWeightValue}
                min={0}
                step={0.01}
              />
              <SelectField
                label="Weight Unit"
                value={unit}
                onChange={(v) => setUnit(v as 'tola' | 'gram' | 'kg')}
                options={[
                  { label: 'Tola (तोला)', value: 'tola' },
                  { label: 'Grams (g)', value: 'gram' },
                  { label: 'Kilograms (kg)', value: 'kg' },
                ]}
              />
            </div>

            <div className="border-t border-border/60 pt-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim m-0">
                Market Rate & Additional Fees (NPR)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InputField
                  label="Gold Rate (per Tola)"
                  type="number"
                  value={ratePerTola}
                  onChange={setRatePerTola}
                  min={0}
                  step={500}
                  unit="NPR"
                />
                <InputField
                  label="Making Charge (ज्याला)"
                  type="number"
                  value={makingCharge}
                  onChange={setMakingCharge}
                  min={0}
                  step={500}
                  unit="NPR"
                />
                <InputField
                  label="Stone / Wastage / Jhad"
                  type="number"
                  value={otherCharge}
                  onChange={setOtherCharge}
                  min={0}
                  step={500}
                  unit="NPR"
                />
              </div>
            </div>
          </div>

          <FormulaExplanation
            title="Gold Measurement Standards in Nepal"
            notes={[
              '1 Tola = 11.6638 Grams = 16 Aana = 64 Lal.',
              '1 Aana (Gold) = 0.7289 Grams = 4 Lal.',
              '1 Lal (Gold) = 0.1822 Grams.',
              'Metal Cost = Weight in Tolas × Daily Federation Rate.',
              'Total Jewellery Cost = Metal Cost + Making Charge (Jyala) + Wastage (Jhad) + Stone weight.',
            ]}
          />
          <SourceNotice source="Federation of Nepal Gold and Silver Dealers’ Association (FENEGOSIDA)" />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Estimated Gold Cost"
            primaryValue={`Rs ${result.totalCost.toLocaleString()}`}
            primaryUnit="Total"
            statusBadge={{
              label: `${result.tola} Tola (${result.grams}g)`,
              variant: 'success',
            }}
            shareSummary={`Gold Price: ${result.tola} Tola (${result.grams}g) = Rs ${result.totalCost.toLocaleString()} (Metal: Rs ${result.metalCost.toLocaleString()})`}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Pure Metal Cost"
                value={`Rs ${result.metalCost.toLocaleString()}`}
                highlight="accent"
              />
              <ResultMetric
                label="Weight in Tola"
                value={`${result.tola}`}
                unit="tola"
              />
              <ResultMetric
                label="Weight in Grams"
                value={`${result.grams}`}
                unit="g"
              />
              <ResultMetric
                label="Weight in Kilograms"
                value={`${result.kilograms}`}
                unit="kg"
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
