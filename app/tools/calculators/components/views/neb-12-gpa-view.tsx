'use client';

import React, { useState, useMemo } from 'react';
import { NEB_CLASS12_STREAMS } from '../../config/neb-class12-subjects';
import { calculateNebGpa, type SubjectEntry } from '../../engines/neb-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import ValidationMessage from '../primitives/validation-message';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators } from '../../registry/calculators-registry';

interface Class12SubjectState {
  id: string;
  name: string;
  creditHours: number;
  theoryFull: number;
  theoryMarks: number;
  internalFull: number;
  internalMarks: number;
}

export default function Neb12GpaView() {
  const calculator = calculators.find((c) => c.slug === 'neb-class-12-gpa')!;

  const [selectedStream, setSelectedStream] = useState<string>('science');

  const streamConfig = useMemo(() => {
    return (
      NEB_CLASS12_STREAMS.find((s) => s.id === selectedStream) ||
      NEB_CLASS12_STREAMS[0]
    );
  }, [selectedStream]);

  const [rows, setRows] = useState<Class12SubjectState[]>(() =>
    streamConfig.subjects.map((sub) => ({
      id: sub.id,
      name: sub.name,
      creditHours: sub.creditHours,
      theoryFull: sub.theoryFullMarks,
      theoryMarks: sub.defaultTheoryMarks ?? 55,
      internalFull: sub.internalFullMarks,
      internalMarks: sub.defaultInternalMarks ?? 22,
    }))
  );

  const handleStreamChange = (streamId: string) => {
    setSelectedStream(streamId);
    const targetStream = NEB_CLASS12_STREAMS.find((s) => s.id === streamId)!;
    setRows(
      targetStream.subjects.map((sub) => ({
        id: sub.id,
        name: sub.name,
        creditHours: sub.creditHours,
        theoryFull: sub.theoryFullMarks,
        theoryMarks: sub.defaultTheoryMarks ?? 55,
        internalFull: sub.internalFullMarks,
        internalMarks: sub.defaultInternalMarks ?? 22,
      }))
    );
  };

  const handleUpdate = (id: string, field: keyof Class12SubjectState, val: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
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
              : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
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
        <div className="lg:col-span-7 space-y-6">
          {/* Stream Selector */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              Choose Stream / Faculty
            </div>
            <div className="flex flex-wrap gap-2">
              {NEB_CLASS12_STREAMS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStreamChange(s.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    selectedStream === s.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-card text-text-dim hover:text-text border-border hover:bg-muted/40'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-dim m-0">
              {streamConfig.description}
            </p>
          </div>

          {/* Subject Inputs */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-text m-0">Class 12 Subject Marks</h3>

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
            title="NEB Class 12 Grading Guidelines"
            formula="GPA = Sum(Grade Point × Credit Hours) / Total Credit Hours (27)"
            notes={[
              'Compulsory English has 4 Credit Hours, Compulsory Nepali has 3 Credit Hours, and elective subjects have 5 Credit Hours each.',
              'Minimum 35% marks required in theoretical paper (26.25/75) to qualify for grade award.',
              'Minimum 40% marks required in internal practical assessment (10/25).',
              'Failure in up to 2 subjects allows a student to attend the Grade Increment (Purak) exam within the same year.',
            ]}
          />
          <SourceNotice source="National Examinations Board (NEB) Nepal Letter Grading Directive 2078" />
        </div>

        {/* Right Sticky Result Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Class 12 NEB Result"
            primaryValue={result.hasNg ? 'NG' : result.gpa.toFixed(2)}
            primaryUnit={result.hasNg ? '' : 'GPA'}
            statusBadge={{
              label: result.status,
              variant: result.hasNg ? 'danger' : result.gpa >= 3.6 ? 'success' : 'default',
            }}
            shareSummary={
              result.hasNg
                ? `NEB Class 12 Result: Non-Graded (${result.ngCount} subject(s) below cutoff)`
                : `NEB Class 12 Result: ${result.gpa.toFixed(2)} GPA (${result.overallGrade}) - ${result.status}`
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
                  message={`${result.ngCount} subject(s) are Non-Graded. NEB allows up to 2 subjects for the Supplementary (Grade Increment) Examination.`}
                />
              </div>
            )}

            <div className="mt-5 space-y-2">
              <div className="text-xs font-semibold text-text">Subject Breakdown</div>
              <BreakdownTable columns={columns} data={result.evaluatedSubjects} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
