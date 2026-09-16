'use client';

import React, { useState, useMemo } from 'react';
import { calculateDateDiff } from '../../engines/everyday-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators } from '../../registry/calculators-registry';

export default function DateDiffView() {
  const calculator = calculators.find((c) => c.slug === 'date-difference')!;

  const [cal1, setCal1] = useState<'BS' | 'AD'>('BS');
  const [y1, setY1] = useState(2080);
  const [m1, setM1] = useState(1);
  const [d1, setD1] = useState(1);

  const [cal2, setCal2] = useState<'BS' | 'AD'>('BS');
  const [y2, setY2] = useState(2081);
  const [m2, setM2] = useState(6);
  const [d2, setD2] = useState(15);

  const result = useMemo(() => {
    return calculateDateDiff(
      { year: Number(y1) || 2080, month: Number(m1) || 1, day: Number(d1) || 1 },
      { year: Number(y2) || 2081, month: Number(m2) || 1, day: Number(d2) || 1 },
      cal1,
      cal2
    );
  }, [y1, m1, d1, cal1, y2, m2, d2, cal2]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Start Date */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim m-0">Start Date</h3>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCal1('BS')}
                  className={`px-2 py-0.5 rounded font-medium ${cal1 === 'BS' ? 'bg-card font-bold text-text border' : 'text-text-dim'}`}
                >
                  BS
                </button>
                <button
                  type="button"
                  onClick={() => setCal1('AD')}
                  className={`px-2 py-0.5 rounded font-medium ${cal1 === 'AD' ? 'bg-card font-bold text-text border' : 'text-text-dim'}`}
                >
                  AD
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Year" type="number" value={y1} onChange={setY1} />
              <InputField label="Month" type="number" value={m1} onChange={setM1} min={1} max={12} />
              <InputField label="Day" type="number" value={d1} onChange={setD1} min={1} max={32} />
            </div>
          </div>

          {/* End Date */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim m-0">End Date</h3>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCal2('BS')}
                  className={`px-2 py-0.5 rounded font-medium ${cal2 === 'BS' ? 'bg-card font-bold text-text border' : 'text-text-dim'}`}
                >
                  BS
                </button>
                <button
                  type="button"
                  onClick={() => setCal2('AD')}
                  className={`px-2 py-0.5 rounded font-medium ${cal2 === 'AD' ? 'bg-card font-bold text-text border' : 'text-text-dim'}`}
                >
                  AD
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Year" type="number" value={y2} onChange={setY2} />
              <InputField label="Month" type="number" value={m2} onChange={setM2} min={1} max={12} />
              <InputField label="Day" type="number" value={d2} onChange={setD2} min={1} max={32} />
            </div>
          </div>

          <FormulaExplanation
            title="Bi-directional BS & AD Support"
            notes={[
              'You can compare BS to BS, AD to AD, or cross-compare BS to AD seamlessly.',
              'Calculates calendar years, calendar months, days, total elapsed days, and total elapsed weeks.',
            ]}
          />
          <SourceNotice source="Nepal Patro Ephemeris & Gregorian Calendar Standards" />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Elapsed Difference"
            primaryValue={`${result.totalDays.toLocaleString()}`}
            primaryUnit="Days"
            statusBadge={{
              label: `${result.years}y ${result.months}m ${result.days}d`,
              variant: 'success',
            }}
            shareSummary={`Date Difference: ${result.years} years, ${result.months} months, ${result.days} days (${result.totalDays} total days)`}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Calendar Duration"
                value={`${result.years}y ${result.months}m`}
                subtext={`${result.days} days`}
                highlight="accent"
              />
              <ResultMetric
                label="Total Days"
                value={result.totalDays.toLocaleString()}
                unit="days"
              />
              <ResultMetric
                label="Total Weeks"
                value={result.weeks}
                unit="wks"
              />
              <ResultMetric
                label="Rough Months"
                value={Number((result.totalDays / 30.4375).toFixed(1))}
                unit="mo"
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
