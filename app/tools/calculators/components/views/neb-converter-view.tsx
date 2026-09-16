'use client';

import React, { useState, useMemo } from 'react';
import { getGradeFromPercentage, NEB_GRADING_SCALE } from '../../config/neb-grading-rules';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators } from '../../registry/calculators-registry';

export default function NebConverterView() {
  const calculator = calculators.find((c) => c.slug === 'neb-marks-converter')!;

  const [mode, setMode] = useState<'percentage-to-gpa' | 'gpa-to-percentage'>('percentage-to-gpa');
  const [percentage, setPercentage] = useState<number>(78);
  const [gpaInput, setGpaInput] = useState<number>(3.6);

  const pctResult = useMemo(() => {
    return getGradeFromPercentage(percentage);
  }, [percentage]);

  const gpaResult = useMemo(() => {
    // Equivalent percentage range for given GPA under CDC scale
    const matchingGrade = NEB_GRADING_SCALE.find(
      (g) => gpaInput >= g.gradePoint - 0.05
    ) || NEB_GRADING_SCALE[NEB_GRADING_SCALE.length - 1];

    // Rough approximate percentage formula used in Nepal: (GPA / 4.0) * 100 or scale band midpoint
    const approxPct = (gpaInput / 4.0) * 100;
    return {
      approxPct: approxPct.toFixed(1),
      grade: matchingGrade.grade,
      description: matchingGrade.description,
      minPct: matchingGrade.minPercentage,
      maxPct: matchingGrade.maxPercentage,
    };
  }, [gpaInput]);

  const scaleColumns: Column<any>[] = [
    { header: 'Interval (%)', accessor: (r) => `${r.minPercentage}% – ${r.maxPercentage}%` },
    { header: 'Grade', accessor: (r) => <span className="font-bold">{r.grade}</span>, align: 'center' },
    { header: 'Grade Point', accessor: (r) => r.gradePoint.toFixed(2), align: 'center' },
    { header: 'Performance', accessor: 'description' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Tabs */}
          <div className="flex gap-2 p-1.5 rounded-xl bg-muted/40 border border-border">
            <button
              type="button"
              onClick={() => setMode('percentage-to-gpa')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'percentage-to-gpa'
                  ? 'bg-card text-text shadow-xs'
                  : 'text-text-dim hover:text-text'
              }`}
            >
              Percentage → GPA & Grade
            </button>
            <button
              type="button"
              onClick={() => setMode('gpa-to-percentage')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'gpa-to-percentage'
                  ? 'bg-card text-text shadow-xs'
                  : 'text-text-dim hover:text-text'
              }`}
            >
              GPA → Equivalent Percentage
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            {mode === 'percentage-to-gpa' ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text m-0">Enter Marks or Percentage</h3>
                <InputField
                  label="Score Percentage (%)"
                  type="number"
                  value={percentage}
                  onChange={setPercentage}
                  min={0}
                  max={100}
                  step={0.1}
                  unit="%"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={percentage}
                  onChange={(e) => setPercentage(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text m-0">Enter Grade Point Average (GPA)</h3>
                <InputField
                  label="GPA (0.0 to 4.0)"
                  type="number"
                  value={gpaInput}
                  onChange={setGpaInput}
                  min={0}
                  max={4.0}
                  step={0.05}
                />
                <input
                  type="range"
                  min={0}
                  max={4.0}
                  step={0.05}
                  value={gpaInput}
                  onChange={(e) => setGpaInput(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            )}
          </div>

          {/* Official Scale Reference Table */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim m-0">
              Official CDC Letter Grading Scale (Directive 2078)
            </h3>
            <BreakdownTable columns={scaleColumns} data={NEB_GRADING_SCALE} />
          </div>

          <SourceNotice source="Curriculum Development Centre (CDC) Letter Grading Directive 2078" />
        </div>

        {/* Right Result Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          {mode === 'percentage-to-gpa' ? (
            <ResultPanel
              title="Official Conversion"
              primaryValue={pctResult.grade}
              primaryUnit={`(${pctResult.gradePoint.toFixed(2)} GP)`}
              statusBadge={{
                label: pctResult.description,
                variant: pctResult.grade === 'NG' ? 'danger' : 'success',
              }}
            >
              <div className="grid grid-cols-2 gap-2 mt-4">
                <ResultMetric
                  label="Grade Point"
                  value={pctResult.gradePoint.toFixed(2)}
                  highlight={pctResult.grade === 'NG' ? 'danger' : 'accent'}
                />
                <ResultMetric
                  label="Input Score"
                  value={`${percentage}%`}
                />
                <ResultMetric
                  label="Score Range"
                  value={`${pctResult.minPercentage}% - ${pctResult.maxPercentage}%`}
                />
                <ResultMetric
                  label="Result Status"
                  value={pctResult.grade === 'NG' ? 'Non-Graded' : 'Pass'}
                  highlight={pctResult.grade === 'NG' ? 'danger' : 'success'}
                />
              </div>
            </ResultPanel>
          ) : (
            <ResultPanel
              title="Equivalent Percentage"
              primaryValue={`~${gpaResult.approxPct}%`}
              primaryUnit="Estimated"
              statusBadge={{
                label: `Grade ${gpaResult.grade}`,
                variant: 'default',
              }}
            >
              <div className="grid grid-cols-2 gap-2 mt-4">
                <ResultMetric
                  label="Corresponding Grade"
                  value={gpaResult.grade}
                  highlight="accent"
                />
                <ResultMetric
                  label="Performance"
                  value={gpaResult.description}
                />
                <ResultMetric
                  label="Band Range"
                  value={`${gpaResult.minPct}% - ${gpaResult.maxPct}%`}
                />
                <ResultMetric
                  label="Max Possible"
                  value="4.00 GPA"
                />
              </div>
            </ResultPanel>
          )}
        </div>
      </div>
    </div>
  );
}
