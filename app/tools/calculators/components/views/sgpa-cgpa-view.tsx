'use client';

import React, { useState, useMemo } from 'react';
import { calculateSgpa, type SemesterItem } from '../../engines/everyday-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators } from '../../registry/calculators-registry';
import { Plus, Trash2 } from 'lucide-react';

export default function SgpaCgpaView() {
  const calculator = calculators.find((c) => c.slug === 'sgpa-cgpa')!;

  const [semesters, setSemesters] = useState<SemesterItem[]>([
    { semester: 'Semester 1', creditHours: 18, gpa: 3.65 },
    { semester: 'Semester 2', creditHours: 19, gpa: 3.72 },
    { semester: 'Semester 3', creditHours: 20, gpa: 3.55 },
    { semester: 'Semester 4', creditHours: 18, gpa: 3.8 },
  ]);

  const handleUpdate = (idx: number, field: keyof SemesterItem, val: any) => {
    setSemesters((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    );
  };

  const handleAddSemester = () => {
    const nextNum = semesters.length + 1;
    setSemesters((prev) => [
      ...prev,
      { semester: `Semester ${nextNum}`, creditHours: 18, gpa: 3.5 },
    ]);
  };

  const handleRemove = (idx: number) => {
    if (semesters.length <= 1) return;
    setSemesters((prev) => prev.filter((_, i) => i !== idx));
  };

  const result = useMemo(() => calculateSgpa(semesters), [semesters]);

  const columns: Column<any>[] = [
    { header: 'Semester', accessor: 'semester' },
    { header: 'Credits', accessor: 'creditHours', align: 'center' },
    { header: 'SGPA', accessor: (r) => r.gpa.toFixed(2), align: 'center' },
    {
      header: 'Points',
      accessor: (r) => (r.creditHours * r.gpa).toFixed(1),
      align: 'right',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text m-0">Semester Records</h2>
              <button
                type="button"
                onClick={handleAddSemester}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 hover:bg-blue-100 transition-colors"
              >
                <Plus size={13} />
                <span>Add Semester</span>
              </button>
            </div>

            <div className="space-y-3">
              {semesters.map((sem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border/70 bg-muted/20 flex flex-wrap sm:flex-nowrap items-center gap-3"
                >
                  <div className="w-full sm:w-1/3">
                    <label className="text-[10px] text-text-dim block mb-1">Semester Name</label>
                    <input
                      type="text"
                      value={sem.semester}
                      onChange={(e) => handleUpdate(idx, 'semester', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-text focus:outline-hidden focus:border-accent"
                    />
                  </div>

                  <div className="w-1/2 sm:w-1/4">
                    <label className="text-[10px] text-text-dim block mb-1">Credits</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={sem.creditHours}
                      onChange={(e) =>
                        handleUpdate(idx, 'creditHours', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-text focus:outline-hidden focus:border-accent"
                    />
                  </div>

                  <div className="w-1/2 sm:w-1/4">
                    <label className="text-[10px] text-text-dim block mb-1">SGPA (0–4.0)</label>
                    <input
                      type="number"
                      min={0}
                      max={4.0}
                      step={0.01}
                      value={sem.gpa}
                      onChange={(e) =>
                        handleUpdate(idx, 'gpa', Math.min(4.0, Math.max(0, parseFloat(e.target.value) || 0)))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-bold text-text focus:outline-hidden focus:border-accent"
                    />
                  </div>

                  {semesters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-2 text-text-dim hover:text-red-600 transition-colors self-end sm:self-center"
                      title="Remove semester"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <FormulaExplanation
            title="CGPA Formula"
            formula="CGPA = Sum(Semester SGPA × Semester Credits) / Total Completed Credits"
            notes={[
              'Used across Tribhuvan University (TU), Kathmandu University (KU), Pokhara University (PU), and Purbanchal University (PU).',
              'Credit-weighting ensures larger semesters have proportional representation in your final degree GPA.',
            ]}
          />
          <SourceNotice source="Nepal University Standard Credit System (UGC Nepal)" />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Cumulative GPA (CGPA)"
            primaryValue={result.cgpa.toFixed(2)}
            primaryUnit="CGPA"
            statusBadge={{
              label: `${result.totalCredits} Total Credits`,
              variant: result.cgpa >= 3.6 ? 'success' : 'default',
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Cumulative GPA"
                value={result.cgpa.toFixed(2)}
                highlight="accent"
              />
              <ResultMetric
                label="Total Credits"
                value={result.totalCredits}
                unit="Cr"
              />
              <ResultMetric
                label="Quality Points"
                value={result.totalQualityPoints.toFixed(1)}
              />
              <ResultMetric
                label="Semesters"
                value={semesters.length}
              />
            </div>

            <div className="mt-5 space-y-2">
              <div className="text-xs font-semibold text-text">Semester Weights</div>
              <BreakdownTable columns={columns} data={semesters} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
