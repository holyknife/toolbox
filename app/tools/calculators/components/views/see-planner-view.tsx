'use client';

import React, { useState, useMemo } from 'react';
import { defaultSeeSubjects } from '../../config/see-subjects';
import { calculateNebGpa, type SubjectEntry } from '../../engines/neb-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import ExamplePresets from '../primitives/example-presets';
import { calculators } from '../../registry/calculators-registry';
import { Target, TrendingUp } from 'lucide-react';

interface PlannerSubjectState {
  id: string;
  name: string;
  creditHours: number;
  theoryFull: number;
  theoryMarks: number;
  internalFull: number;
  internalMarks: number;
}

export default function SeePlannerView() {
  const calculator = calculators.find((c) => c.slug === 'see-gpa-planner')!;

  const [targetGpa, setTargetGpa] = useState<number>(3.6);
  const [rows, setRows] = useState<PlannerSubjectState[]>(
    defaultSeeSubjects.map((sub) => ({
      id: sub.id,
      name: sub.name,
      creditHours: sub.creditHours,
      theoryFull: sub.theoryFull,
      theoryMarks: 50,
      internalFull: sub.internalFull,
      internalMarks: 22,
    }))
  );

  const handleUpdateMarks = (id: string, theory: number, internal: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, theoryMarks: theory, internalMarks: internal } : r
      )
    );
  };

  const subjectEntries: SubjectEntry[] = useMemo(() => {
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      creditHours: r.creditHours,
      theoryMarks: r.theoryMarks,
      theoryFull: r.theoryFull,
      internalMarks: r.internalMarks,
      internalFull: r.internalFull,
    }));
  }, [rows]);

  const result = useMemo(() => calculateNebGpa(subjectEntries), [subjectEntries]);

  const gap = Number((targetGpa - result.gpa).toFixed(2));

  const presets = [
    {
      label: 'Target 3.6+ (A)',
      values: 3.6,
    },
    {
      label: 'Target 3.8+ (A+)',
      values: 3.8,
    },
    {
      label: 'Target 3.2+ (B+)',
      values: 3.2,
    },
  ];

  const boostLowSubjects = () => {
    setRows((prev) =>
      prev.map((r) => {
        const currentPct = ((r.theoryMarks + r.internalMarks) / (r.theoryFull + r.internalFull)) * 100;
        if (currentPct < 70) {
          return {
            ...r,
            theoryMarks: Math.min(r.theoryFull, Math.round(r.theoryMarks + 8)),
          };
        }
        return r;
      })
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Target GPA Selector */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-text m-0">Set Your Target GPA</h2>
              </div>
              <div className="flex items-center gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setTargetGpa(p.values)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      targetGpa === p.values
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-muted/40 hover:bg-muted text-text border-border'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={2.0}
                max={4.0}
                step={0.05}
                value={targetGpa}
                onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-lg font-black font-mono text-text w-12 text-right">
                {targetGpa.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Subject sliders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text m-0">Fine-tune Expected Marks</h3>
                <p className="text-xs text-text-dim m-0 mt-0.5">
                  Drag sliders to see how improving specific subjects lifts your overall GPA.
                </p>
              </div>
              <button
                type="button"
                onClick={boostLowSubjects}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 hover:bg-blue-100 transition-colors"
              >
                <TrendingUp size={13} />
                <span>Auto-Boost Low</span>
              </button>
            </div>

            <div className="space-y-4">
              {rows.map((row) => {
                const subPct = Math.round(
                  ((row.theoryMarks + row.internalMarks) / (row.theoryFull + row.internalFull)) * 100
                );
                return (
                  <div key={row.id} className="p-3 rounded-xl border border-border/70 bg-muted/20">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-semibold text-text">{row.name}</span>
                      <span className="font-mono font-bold text-text">
                        {row.theoryMarks}/{row.theoryFull} theory + {row.internalMarks}/{row.internalFull} int = {subPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-text-dim w-10">Theory</span>
                      <input
                        type="range"
                        min={0}
                        max={row.theoryFull}
                        step={1}
                        value={row.theoryMarks}
                        onChange={(e) =>
                          handleUpdateMarks(row.id, parseInt(e.target.value) || 0, row.internalMarks)
                        }
                        className="w-full accent-blue-600"
                      />
                      <span className="text-xs font-mono font-bold w-7 text-right">
                        {row.theoryMarks}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <FormulaExplanation
            title="How the planner works"
            notes={[
              'Simulates real-time credit-weighted calculations according to CDC Directive 2078.',
              'Helps pinpoint which subjects give the highest marginal lift per study hour.',
              'Identifies bottleneck subjects that might cause Non-Graded (NG) status even if other subjects are high.',
            ]}
          />
          <SourceNotice source="CDC / NEB Letter Grading Directive 2078" />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Projected SEE GPA"
            primaryValue={result.hasNg ? 'NG' : result.gpa.toFixed(2)}
            primaryUnit="GPA"
            statusBadge={{
              label:
                gap <= 0
                  ? 'Target Achieved!'
                  : `${gap.toFixed(2)} GPA needed`,
              variant: gap <= 0 ? 'success' : 'warning',
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Current Projected"
                value={result.gpa.toFixed(2)}
                highlight={result.hasNg ? 'danger' : 'accent'}
              />
              <ResultMetric
                label="Target Goal"
                value={targetGpa.toFixed(2)}
              />
              <ResultMetric
                label="Overall Grade"
                value={result.overallGrade}
              />
              <ResultMetric
                label="Gap to Target"
                value={gap <= 0 ? '0.00' : `+${gap.toFixed(2)}`}
                highlight={gap <= 0 ? 'success' : 'warning'}
              />
            </div>

            <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border text-xs text-text-dim">
              {gap <= 0 ? (
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  🎉 Great job! Your expected scores exceed your target goal of {targetGpa.toFixed(2)} GPA.
                </div>
              ) : (
                <div>
                  To reach your target of <strong className="text-text">{targetGpa.toFixed(2)}</strong>, try boosting your marks in 4-credit or 5-credit subjects where your theory score is below 55.
                </div>
              )}
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
