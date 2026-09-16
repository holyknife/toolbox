'use client';

import React, { useState, useMemo } from 'react';
import {
  hillToSqFt,
  teraiToSqFt,
  convertFromSqFt,
} from '../../engines/land-engine';
import { SQFT_PER_UNIT } from '../../config/nepal-land-units';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import ExamplePresets from '../primitives/example-presets';
import { getCalculatorBySlug } from '../../registry/calculators-registry';

type SystemMode = 'hill' | 'terai' | 'sqft' | 'sqm';

export default function NepalLandView() {
  const calculator = getCalculatorBySlug('nepal-land-converter')!;

  const [mode, setMode] = useState<SystemMode>('hill');

  // Hill state
  const [ropani, setRopani] = useState(0);
  const [aana, setAana] = useState(4);
  const [paisa, setPaisa] = useState(2);
  const [daam, setDaam] = useState(1);

  // Terai state
  const [bigha, setBigha] = useState(0);
  const [kattha, setKattha] = useState(5);
  const [dhur, setDhur] = useState(10);

  // Metric state
  const [sqFtInput, setSqFtInput] = useState(1369); // 4 aana = 1369 sq ft
  const [sqMInput, setSqMInput] = useState(127.18);

  const totalSqFt = useMemo(() => {
    if (mode === 'hill') {
      return hillToSqFt(ropani, aana, paisa, daam);
    }
    if (mode === 'terai') {
      return teraiToSqFt(bigha, kattha, dhur);
    }
    if (mode === 'sqm') {
      return (Number(sqMInput) || 0) * SQFT_PER_UNIT.sqMetre;
    }
    return Number(sqFtInput) || 0;
  }, [mode, ropani, aana, paisa, daam, bigha, kattha, dhur, sqFtInput, sqMInput]);

  const result = useMemo(() => convertFromSqFt(totalSqFt), [totalSqFt]);

  const presets = [
    {
      label: 'Typical Valley House (4 Aana)',
      values: () => {
        setMode('hill');
        setRopani(0);
        setAana(4);
        setPaisa(0);
        setDaam(0);
      },
    },
    {
      label: '1 Ropani Standard',
      values: () => {
        setMode('hill');
        setRopani(1);
        setAana(0);
        setPaisa(0);
        setDaam(0);
      },
    },
    {
      label: '10 Kattha Terai Farm',
      values: () => {
        setMode('terai');
        setBigha(0);
        setKattha(10);
        setDhur(0);
      },
    },
    {
      label: '1 Bigha Land',
      values: () => {
        setMode('terai');
        setBigha(1);
        setKattha(0);
        setDhur(0);
      },
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Switcher */}
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-muted/40 border border-border">
            <button
              type="button"
              onClick={() => setMode('hill')}
              className={`flex-1 min-w-[110px] py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'hill'
                  ? 'bg-card text-text shadow-xs'
                  : 'text-text-dim hover:text-text'
              }`}
            >
              Hill (R-A-P-D)
            </button>
            <button
              type="button"
              onClick={() => setMode('terai')}
              className={`flex-1 min-w-[110px] py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'terai'
                  ? 'bg-card text-text shadow-xs'
                  : 'text-text-dim hover:text-text'
              }`}
            >
              Terai (B-K-D)
            </button>
            <button
              type="button"
              onClick={() => setMode('sqft')}
              className={`flex-1 min-w-[90px] py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'sqft'
                  ? 'bg-card text-text shadow-xs'
                  : 'text-text-dim hover:text-text'
              }`}
            >
              Square Feet
            </button>
            <button
              type="button"
              onClick={() => setMode('sqm')}
              className={`flex-1 min-w-[90px] py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'sqm'
                  ? 'bg-card text-text shadow-xs'
                  : 'text-text-dim hover:text-text'
              }`}
            >
              Sq Metre
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text m-0">Input Land Area</h2>
              <ExamplePresets
                presets={presets.map((p) => ({ label: p.label, values: p.values }))}
                onSelect={(fn) => fn()}
              />
            </div>

            {mode === 'hill' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InputField
                  label="Ropani"
                  type="number"
                  value={ropani}
                  onChange={setRopani}
                  min={0}
                  unit="ropani"
                />
                <InputField
                  label="Aana"
                  type="number"
                  value={aana}
                  onChange={setAana}
                  min={0}
                  max={15}
                  unit="aana"
                />
                <InputField
                  label="Paisa"
                  type="number"
                  value={paisa}
                  onChange={setPaisa}
                  min={0}
                  max={3}
                  unit="paisa"
                />
                <InputField
                  label="Daam"
                  type="number"
                  value={daam}
                  onChange={setDaam}
                  min={0}
                  max={3.99}
                  step={0.1}
                  unit="daam"
                />
              </div>
            )}

            {mode === 'terai' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InputField
                  label="Bigha"
                  type="number"
                  value={bigha}
                  onChange={setBigha}
                  min={0}
                  unit="bigha"
                />
                <InputField
                  label="Kattha"
                  type="number"
                  value={kattha}
                  onChange={setKattha}
                  min={0}
                  max={19}
                  unit="kattha"
                />
                <InputField
                  label="Dhur"
                  type="number"
                  value={dhur}
                  onChange={setDhur}
                  min={0}
                  max={19.99}
                  step={0.1}
                  unit="dhur"
                />
              </div>
            )}

            {mode === 'sqft' && (
              <InputField
                label="Total Area in Square Feet (sq ft)"
                type="number"
                value={sqFtInput}
                onChange={setSqFtInput}
                min={0}
                unit="sq ft"
              />
            )}

            {mode === 'sqm' && (
              <InputField
                label="Total Area in Square Metres (sq m)"
                type="number"
                value={sqMInput}
                onChange={setSqMInput}
                min={0}
                unit="sq m"
              />
            )}
          </div>

          <FormulaExplanation
            title="Official Land Measurement Standards in Nepal"
            notes={[
              'Hill System: 1 Ropani = 16 Aana = 64 Paisa = 256 Daam = 5,476 sq ft (508.74 sq m).',
              'Hill Unit: 1 Aana = 342.25 sq ft (31.80 sq m) = 4 Paisa = 16 Daam.',
              'Terai System: 1 Bigha = 20 Kattha = 400 Dhur = 72,900 sq ft (6,772.63 sq m).',
              'Terai Unit: 1 Kattha = 3,645 sq ft (338.63 sq m) = 20 Dhur. 1 Dhur = 182.25 sq ft.',
              '1 Bigha ≈ 13.31 Ropani. 1 Ropani ≈ 1.50 Kattha.',
            ]}
          />
          <SourceNotice source="Survey Department of Nepal (Napi Bibhag) Official Standards" />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Converted Area"
            primaryValue={
              mode === 'hill'
                ? result.formattedTerai
                : result.formattedHill
            }
            primaryUnit=""
            statusBadge={{
              label: `${result.sqFeet.toLocaleString()} sq ft`,
              variant: 'success',
            }}
            onReset={() => {
              setRopani(0);
              setAana(4);
              setPaisa(0);
              setDaam(0);
              setSqFtInput(1369);
            }}
          >
            <div className="space-y-3 mt-4">
              <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1">
                <div className="text-[11px] font-semibold uppercase text-text-dim tracking-wider">
                  Hill System (R - A - P - D)
                </div>
                <div className="text-base font-black text-text font-mono">
                  {result.formattedHill}
                </div>
                <div className="text-xs text-text-dim">
                  {result.decimalRopani.toFixed(4)} Ropani (Decimal)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-1">
                <div className="text-[11px] font-semibold uppercase text-text-dim tracking-wider">
                  Terai System (B - K - D)
                </div>
                <div className="text-base font-black text-text font-mono">
                  {result.formattedTerai}
                </div>
                <div className="text-xs text-text-dim">
                  {result.decimalBigha.toFixed(4)} Bigha (Decimal)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Square Feet"
                value={result.sqFeet.toLocaleString()}
                unit="sq ft"
                highlight="accent"
              />
              <ResultMetric
                label="Square Metres"
                value={result.sqMetre.toLocaleString()}
                unit="sq m"
              />
              <ResultMetric
                label="Acres"
                value={result.acre.toFixed(4)}
                unit="acre"
              />
              <ResultMetric
                label="Hectares"
                value={result.hectare.toFixed(4)}
                unit="ha"
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
