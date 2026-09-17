'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import { getCalculatorBySlug } from '../../registry/calculators-registry';

interface CourseItem {
  id: string;
  name: string;
  credits: number;
  grade: string; // Letter grade or custom points
}

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0,
};

export default function GpaView() {
  const calculator = getCalculatorBySlug('gpa')!;

  const [courses, setCourses] = useState<CourseItem[]>([
    { id: '1', name: 'Course 1', credits: 3, grade: 'A' },
    { id: '2', name: 'Course 2', credits: 4, grade: 'A-' },
    { id: '3', name: 'Course 3', credits: 3, grade: 'B+' },
    { id: '4', name: 'Course 4', credits: 3, grade: 'B' },
  ]);

  // Optional Cumulative CGPA
  const [includePrior, setIncludePrior] = useState(false);
  const [priorGpa, setPriorGpa] = useState(3.5);
  const [priorCredits, setPriorCredits] = useState(30);

  const handleUpdate = (id: string, field: keyof CourseItem, val: any) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleAdd = () => {
    const nextNum = courses.length + 1;
    setCourses((prev) => [
      ...prev,
      { id: Date.now().toString(), name: `Course ${nextNum}`, credits: 3, grade: 'A' },
    ]);
  };

  const handleRemove = (id: string) => {
    if (courses.length <= 1) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  // Calculations
  const { semesterGpa, totalCredits, totalPoints, cumulativeGpa, totalCumulativeCredits } = useMemo(() => {
    let termCredits = 0;
    let termPoints = 0;

    for (const c of courses) {
      const cred = Number(c.credits) || 0;
      const pt = GRADE_POINTS[c.grade] ?? (Number(c.grade) || 0);
      termCredits += cred;
      termPoints += cred * pt;
    }

    const semGpa = termCredits > 0 ? termPoints / termCredits : 0;

    let cumGpa = semGpa;
    let allCredits = termCredits;

    if (includePrior) {
      const priorPts = (Number(priorGpa) || 0) * (Number(priorCredits) || 0);
      allCredits = termCredits + (Number(priorCredits) || 0);
      cumGpa = allCredits > 0 ? (termPoints + priorPts) / allCredits : 0;
    }

    return {
      semesterGpa: semGpa,
      totalCredits: termCredits,
      totalPoints: termPoints,
      cumulativeGpa: cumGpa,
      totalCumulativeCredits: allCredits,
    };
  }, [courses, includePrior, priorGpa, priorCredits]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text m-0">Courses & Grades</h2>
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <Plus size={14} /> Add Course
              </button>
            </div>

            <div className="space-y-2.5">
              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  className="grid grid-cols-[1fr_80px_100px_32px] sm:grid-cols-[1fr_90px_110px_36px] gap-2 items-center"
                >
                  <input
                    type="text"
                    value={course.name}
                    placeholder={`Course ${idx + 1}`}
                    onChange={(e) => handleUpdate(course.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-input text-text"
                  />
                  <input
                    type="number"
                    value={course.credits}
                    min={0.5}
                    max={20}
                    step={0.5}
                    placeholder="Credits"
                    onChange={(e) => handleUpdate(course.id, 'credits', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-border bg-input text-text text-center"
                  />
                  <select
                    value={course.grade}
                    onChange={(e) => handleUpdate(course.id, 'grade', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-border bg-input text-text font-semibold"
                  >
                    {Object.keys(GRADE_POINTS).map((g) => (
                      <option key={g} value={g}>
                        {g} ({GRADE_POINTS[g].toFixed(1)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={courses.length <= 1}
                    onClick={() => handleRemove(course.id)}
                    aria-label={`Delete ${course.name}`}
                    className="p-1.5 text-text-dim hover:text-rose-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Include Prior GPA option */}
            <div className="pt-3 border-t border-border/70 space-y-3">
              <label className="flex items-center gap-2 text-xs text-text font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePrior}
                  onChange={(e) => setIncludePrior(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-accent cursor-pointer"
                />
                Calculate Cumulative GPA (Include prior semesters)
              </label>

              {includePrior && (
                <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-muted/40 border border-border">
                  <InputField
                    label="Prior Cumulative GPA"
                    type="number"
                    value={priorGpa}
                    onChange={setPriorGpa}
                    min={0}
                    max={4}
                    step={0.01}
                  />
                  <InputField
                    label="Prior Credit Hours"
                    type="number"
                    value={priorCredits}
                    onChange={setPriorCredits}
                    min={0}
                    step={1}
                  />
                </div>
              )}
            </div>
          </div>

          <FormulaExplanation
            title="GPA Calculation Formula"
            notes={[
              'Grade Point Average (GPA) = Sum of (Course Credits × Grade Points) ÷ Total Course Credits.',
              'Quality Points earned = Credits × Grade Points (e.g. 3 credits with an A = 12.0 points).',
              'Cumulative CGPA combines prior credit hours and points with current semester performance.',
            ]}
          />
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title={includePrior ? 'Cumulative CGPA' : 'Semester GPA'}
            primaryValue={(includePrior ? cumulativeGpa : semesterGpa).toFixed(2)}
            primaryUnit="GPA (4.0 Scale)"
            statusBadge={{
              label: `${(includePrior ? cumulativeGpa : semesterGpa) >= 3.6 ? 'Honors / Dean’s List' : (includePrior ? cumulativeGpa : semesterGpa) >= 3.0 ? 'Good Standing' : 'Passing'}`,
              variant: (includePrior ? cumulativeGpa : semesterGpa) >= 3.0 ? 'success' : 'accent',
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Semester GPA"
                value={semesterGpa.toFixed(2)}
                highlight="accent"
              />
              <ResultMetric
                label="Semester Credits"
                value={totalCredits}
                unit="hrs"
              />
              <ResultMetric
                label="Quality Points"
                value={totalPoints.toFixed(1)}
              />
              <ResultMetric
                label={includePrior ? 'Total Credits' : 'Courses'}
                value={includePrior ? totalCumulativeCredits : courses.length}
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
