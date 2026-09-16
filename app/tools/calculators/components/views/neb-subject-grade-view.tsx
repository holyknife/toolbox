'use client';

import React, { useState, useMemo } from 'react';
import { evaluateSubject } from '../../engines/neb-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import ValidationMessage from '../primitives/validation-message';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators } from '../../registry/calculators-registry';

export default function NebSubjectGradeView() {
  const calculator = calculators.find((c) => c.slug === 'neb-subject-grade')!;

  const [subjectName, setSubjectName] = useState('Compulsory English');
  const [creditHours, setCreditHours] = useState(4);
  const [theoryFull, setTheoryFull] = useState(75);
  const [theoryMarks, setTheoryMarks] = useState(54);
  const [internalFull, setInternalFull] = useState(25);
  const [internalMarks, setInternalMarks] = useState(22);

  const result = useMemo(() => {
    return evaluateSubject({
      id: 'sub',
      name: subjectName,
      creditHours,
      theoryMarks,
      theoryFull,
      internalMarks,
      internalFull,
    });
  }, [subjectName, creditHours, theoryMarks, theoryFull, internalMarks, internalFull]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Subject Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Subject Name"
                value={subjectName}
                onChange={setSubjectName}
              />
              <InputField
                label="Credit Hours"
                type="number"
                value={creditHours}
                onChange={setCreditHours}
                min={1}
                max={10}
                unit="CH"
              />
            </div>

            <div className="border-t border-border/60 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-3">
                Theory Paper (External Exam)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Theory Full Marks"
                  type="number"
                  value={theoryFull}
                  onChange={setTheoryFull}
                  min={1}
                  max={100}
                />
                <InputField
                  label="Theory Obtained Marks"
                  type="number"
                  value={theoryMarks}
                  onChange={setTheoryMarks}
                  min={0}
                  max={theoryFull}
                  step={0.5}
                />
              </div>
            </div>

            <div className="border-t border-border/60 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-3">
                Internal / Practical Assessment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Internal Full Marks"
                  type="number"
                  value={internalFull}
                  onChange={setInternalFull}
                  min={0}
                  max={100}
                />
                <InputField
                  label="Internal Obtained Marks"
                  type="number"
                  value={internalMarks}
                  onChange={setInternalMarks}
                  min={0}
                  max={internalFull}
                  step={0.5}
                />
              </div>
            </div>
          </div>

          <FormulaExplanation
            title="NEB CDC 2078 Grading Matrix"
            formula="Final % = (Theory Obtained + Internal Obtained) / Total Full Marks × 100"
            notes={[
              'Theory Minimum: 35% of theoretical full marks.',
              'Internal Minimum: 40% of practical/internal full marks.',
              'Failure in either component results in a final grade of Non-Graded (NG).',
            ]}
          />
          <SourceNotice source="Curriculum Development Centre (CDC) & NEB Nepal" />
        </div>

        {/* Right Result Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Subject Evaluation"
            primaryValue={result.finalGrade}
            primaryUnit={`(${result.gradePoint.toFixed(2)} GP)`}
            statusBadge={{
              label: result.isNg ? 'Non-Graded (NG)' : result.finalRemarks,
              variant: result.isNg ? 'danger' : 'success',
            }}
            onReset={() => {
              setTheoryMarks(54);
              setInternalMarks(22);
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Theory Grade"
                value={result.theoryGrade}
                subtext={`${result.theoryPercentage.toFixed(1)}%`}
                highlight={result.isTheoryPassed ? 'default' : 'danger'}
              />
              <ResultMetric
                label="Internal Grade"
                value={result.internalGrade}
                subtext={`${result.internalPercentage.toFixed(1)}%`}
                highlight={result.isInternalPassed ? 'default' : 'danger'}
              />
              <ResultMetric
                label="Total Marks"
                value={`${result.totalObtained}/${result.totalFull}`}
                subtext={`${result.combinedPercentage.toFixed(1)}%`}
              />
              <ResultMetric
                label="Credit Points"
                value={(result.gradePoint * creditHours).toFixed(2)}
                subtext={`${creditHours} Credit Hours`}
              />
            </div>

            {result.isNg && (
              <div className="mt-4">
                <ValidationMessage
                  type="error"
                  title="Non-Graded in this Subject"
                  message={
                    !result.isTheoryPassed && !result.isInternalPassed
                      ? 'Failed both theory (<35%) and internal (<40%) minimum requirements.'
                      : !result.isTheoryPassed
                      ? 'Failed theory minimum: You must score at least 35% in the written exam.'
                      : 'Failed internal minimum: You must score at least 40% in internal practicals.'
                  }
                />
              </div>
            )}
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
