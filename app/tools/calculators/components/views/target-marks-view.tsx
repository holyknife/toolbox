'use client';

import React, { useState, useMemo } from 'react';
import { calculateTargetExamMarks } from '../../engines/neb-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField, { SelectField } from '../primitives/input-section';
import ValidationMessage from '../primitives/validation-message';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators } from '../../registry/calculators-registry';

export default function TargetMarksView() {
  const calculator = calculators.find((c) => c.slug === 'target-marks')!;

  const [targetGrade, setTargetGrade] = useState('A');
  const [theoryFull, setTheoryFull] = useState(75);
  const [internalFull, setInternalFull] = useState(25);
  const [internalObtained, setInternalObtained] = useState(23);

  const gradeOptions = [
    { label: 'A+ (90% - 100%)', value: 'A+' },
    { label: 'A (80% - 89%)', value: 'A' },
    { label: 'B+ (70% - 79%)', value: 'B+' },
    { label: 'B (60% - 69%)', value: 'B' },
    { label: 'C+ (50% - 59%)', value: 'C+' },
    { label: 'C (40% - 49%)', value: 'C' },
    { label: 'D (35% - 39%)', value: 'D' },
  ];

  const result = useMemo(() => {
    return calculateTargetExamMarks({
      targetGrade,
      theoryFullMarks: Number(theoryFull) || 75,
      internalFullMarks: Number(internalFull) || 25,
      internalObtainedMarks: Number(internalObtained) || 0,
    });
  }, [targetGrade, theoryFull, internalFull, internalObtained]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Target & Internal Marks</h2>

            <SelectField
              label="Desired Target Grade"
              value={targetGrade}
              onChange={setTargetGrade}
              options={gradeOptions}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Theory Exam Full Marks"
                type="number"
                value={theoryFull}
                onChange={setTheoryFull}
                min={1}
                max={100}
              />
              <InputField
                label="Internal Full Marks"
                type="number"
                value={internalFull}
                onChange={setInternalFull}
                min={0}
                max={100}
              />
            </div>

            <InputField
              label="Internal / Practical Score Obtained"
              type="number"
              value={internalObtained}
              onChange={setInternalObtained}
              min={0}
              max={internalFull}
              step={0.5}
              subtext={`Full marks: ${internalFull}`}
            />
          </div>

          <FormulaExplanation
            title="How required score is derived"
            formula="Required Theory = (Target Min % × Total Full Marks / 100) − Internal Marks"
            notes={[
              'Also enforces the mandatory 35% theory cutoff (26.25 on a 75 full marks paper).',
              'If the required theory marks exceed full marks, that grade is mathematically unreachable with current internal marks.',
            ]}
          />
          <SourceNotice source="CDC / NEB Letter Grading Directive 2078" />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Required Theory Score"
            primaryValue={result.isPossible ? result.requiredTheoryMarks.toString() : 'Impossible'}
            primaryUnit={result.isPossible ? `/ ${theoryFull}` : ''}
            statusBadge={{
              label: result.statusMessage,
              variant: !result.isPossible ? 'danger' : result.requiredPercentage > 85 ? 'warning' : 'success',
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Required % in Exam"
                value={`${result.requiredPercentage.toFixed(1)}%`}
                highlight={result.isPossible ? 'accent' : 'danger'}
              />
              <ResultMetric
                label="Target Min Combined"
                value={`${result.targetPercentage}%`}
              />
              <ResultMetric
                label="Internal Already Secured"
                value={`${internalObtained}/${internalFull}`}
              />
              <ResultMetric
                label="Theory Pass Cutoff"
                value={`${result.theoryCutoffMarks}`}
                subtext="35% minimum"
              />
            </div>

            {!result.isPossible && (
              <div className="mt-4">
                <ValidationMessage
                  type="error"
                  title="Target Unattainable"
                  message={`Even with 100% full marks in the written theory paper, your total combined percentage will not reach ${result.targetPercentage}%. Consider aiming for the next lower grade.`}
                />
              </div>
            )}
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
