'use client';

import React, { useState, useMemo } from 'react';
import { defaultSeeSubjects, type SeeSubjectConfig } from '../../config/see-subjects';
import { calculateNebGpa, type SubjectEntry } from '../../engines/neb-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import ValidationMessage from '../primitives/validation-message';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import ExamplePresets from '../primitives/example-presets';
import { calculators } from '../../registry/calculators-registry';

interface SubjectRowState {
  id: string;
  name: string;
  creditHours: number;
  theoryFull: number;
  theoryMarks: number;
  internalFull: number;
  internalMarks: number;
}

export default function SeeGpaView() {
  const calculator = calculators.find((c) => c.slug === 'see-gpa')!;

  const initialRows: SubjectRowState[] = defaultSeeSubjects.map((sub) => ({
    id: sub.id,
    name: sub.name,
    creditHours: sub.creditHours,
    theoryFull: sub.theoryFull,
    theoryMarks: 60,
    internalFull: sub.internalFull,
    internalMarks: 23,
  }));

  const [rows, setRows] = useState<SubjectRowState[]>(initialRows);

  const handleUpdate = (id: string, field: keyof SubjectRowState, val: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleReset = () => {
    setRows(initialRows);
  };

  const subjectEntries: SubjectEntry[] = useMemo(() => {
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      creditHours: Number(r.creditHours) || 0,
      theoryMarks: Number(r.theoryMarks) || 0,
      theoryFull: Number(r.theoryFull) || 75,
      internalMarks: Number(r.internalMarks) || 0,
      internalFull: Number(r.internalFull) || 25,
    }));
  }, [rows]);

  const result = useMemo(() => calculateNebGpa(subjectEntries), [subjectEntries]);

  const presets = [
    {
      label: 'Distinction (A+ / A)',
      description: 'Scores between 80% and 95%',
      values: rows.map((r) => ({
        ...r,
        theoryMarks: 68,
        internalMarks: 24,
      })),
    },
    {
      label: 'First Division (B+ / B)',
      description: 'Scores around 65% - 75%',
      values: rows.map((r) => ({
        ...r,
        theoryMarks: 50,
        internalMarks: 22,
      })),
    },
    {
      label: 'Borderline Passing (D)',
      description: 'Exactly at 35% theory cutoff',
      values: rows.map((r) => ({
        ...r,
        theoryMarks: 27,
        internalMarks: 16,
      })),
    },
    {
      label: 'NG Warning Case',
      description: 'One subject fails theory (<35%)',
      values: rows.map((r, idx) => ({
        ...r,
        theoryMarks: idx === 2 ? 22 : 55, // Math theory fails
        internalMarks: 22,
      })),
    },
  ];

  const columns: Column<any>[] = [
    {
      header: 'Subject',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-text">{row.name}</span>
          <span className="text-[10px] text-text-dim block">CH: {row.creditHours}</span>
        </div>
      ),
    },
    {
      header: 'Theory (75)',
      accessor: (row) => (
        <span className={row.theoryGrade === 'NG' ? 'text-red-600 font-bold' : ''}>
          {row.theoryMarks} ({row.theoryGrade})
        </span>
      ),
      align: 'center',
    },
    {
      header: 'Internal (25)',
      accessor: (row) => (
        <span className={row.internalGrade === 'NG' ? 'text-red-600 font-bold' : ''}>
          {row.internalMarks} ({row.internalGrade})
        </span>
      ),
      align: 'center',
    },
    {
      header: 'Final Grade',
      accessor: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold ${
            row.isNg
              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
          }`}
        >
          {row.finalGrade} ({row.gradePoint.toFixed(2)})
        </span>
      ),
      align: 'center',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text m-0">Subject Marks</h2>
              <ExamplePresets presets={presets} onSelect={setRows} />
            </div>

            <p className="text-xs text-text-dim m-0">
              Enter your obtained marks for Theory (Full 75, Min 26.25 to pass) and Internal/Practical (Full 25, Min 10 to pass).
            </p>

            <div className="space-y-3">
              {rows.map((row) => {
                const isTheoryFailed = row.theoryMarks < row.theoryFull * 0.35;
                const isInternalFailed = row.internalMarks < row.internalFull * 0.40;

                return (
                  <div
                    key={row.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isTheoryFailed || isInternalFailed
                        ? 'border-red-300 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20'
                        : 'border-border/70 bg-muted/20 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-text truncate max-w-[200px] sm:max-w-none">
                        {row.name}
                      </span>
                      <span className="text-[11px] text-text-dim font-medium">
                        {row.creditHours} Credits
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-text-dim block mb-1">
                          Theory (out of {row.theoryFull})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={row.theoryFull}
                          step={0.5}
                          value={row.theoryMarks}
                          onChange={(e) =>
                            handleUpdate(row.id, 'theoryMarks', Math.min(row.theoryFull, Math.max(0, parseFloat(e.target.value) || 0)))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-text focus:outline-hidden focus:border-accent"
                        />
                        {isTheoryFailed && (
                          <span className="text-[10px] text-red-600 font-medium block mt-0.5">
                            Min {row.theoryFull * 0.35} required (NG)
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] text-text-dim block mb-1">
                          Internal (out of {row.internalFull})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={row.internalFull}
                          step={0.5}
                          value={row.internalMarks}
                          onChange={(e) =>
                            handleUpdate(row.id, 'internalMarks', Math.min(row.internalFull, Math.max(0, parseFloat(e.target.value) || 0)))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-text focus:outline-hidden focus:border-accent"
                        />
                        {isInternalFailed && (
                          <span className="text-[10px] text-red-600 font-medium block mt-0.5">
                            Min {row.internalFull * 0.40} required (NG)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <FormulaExplanation
            title="NEB / CDC Letter Grading Directive 2078 Rules"
            formula="GPA = Sum(Grade Point × Credit Hours) / Total Credit Hours (32)"
            notes={[
              'Students must secure at least 35% marks in theoretical examination (26.25 out of 75).',
              'Students must secure at least 40% marks in internal / practical examination (10 out of 25).',
              'If a student fails to obtain the minimum required marks in either theory or practical, the final result for that subject is Non-Graded (NG).',
              'Overall GPA is only awarded if all subjects achieve Grade D (1.6) or higher. With any NG, the result is Non-Graded.',
            ]}
          />

          <SourceNotice
            source="Curriculum Development Centre (CDC) & National Examinations Board (NEB) Letter Grading Directive 2078"
            updateDate="2026-04"
          />
        </div>

        {/* Right Sticky Result Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="SEE Class 10 Result"
            primaryValue={result.hasNg ? 'NG' : result.gpa.toFixed(2)}
            primaryUnit={result.hasNg ? '' : 'GPA'}
            statusBadge={{
              label: result.status,
              variant: result.hasNg ? 'danger' : result.gpa >= 3.6 ? 'success' : 'default',
            }}
            onReset={handleReset}
            shareSummary={
              result.hasNg
                ? `SEE Class 10 Result: Non-Graded (${result.ngCount} subject(s) below cutoff)`
                : `SEE Class 10 Result: ${result.gpa.toFixed(2)} GPA (${result.overallGrade}) - ${result.status}`
            }
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Final Grade"
                value={result.overallGrade}
                highlight={result.hasNg ? 'danger' : 'accent'}
              />
              <ResultMetric
                label="Total Credits"
                value={result.totalCredits}
                unit="Cr"
              />
              <ResultMetric
                label="Total Score"
                value={`${result.totalObtainedMarks}/${result.totalFullMarks}`}
                subtext={`${result.percentage.toFixed(1)}%`}
              />
              <ResultMetric
                label="Earned Points"
                value={result.totalQualityPoints.toFixed(1)}
              />
            </div>

            {result.hasNg && (
              <div className="mt-4">
                <ValidationMessage
                  type="error"
                  title="Non-Graded (NG) Alert"
                  message={`${result.ngCount} subject(s) did not meet the mandatory 35% theory or 40% practical threshold. Under CDC 2078 rules, you must sit for the grade improvement exam to receive a certificate.`}
                />
              </div>
            )}

            <div className="mt-5 space-y-2">
              <div className="text-xs font-semibold text-text">Subject Breakdown</div>
              <BreakdownTable
                columns={columns}
                data={result.evaluatedSubjects}
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
