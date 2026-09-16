'use client';

import React, { useState, useMemo } from 'react';
import { calculateAttendance } from '../../engines/everyday-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import ValidationMessage from '../primitives/validation-message';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators } from '../../registry/calculators-registry';

export default function AttendanceView() {
  const calculator = calculators.find((c) => c.slug === 'attendance')!;

  const [classesHeld, setClassesHeld] = useState(80);
  const [classesAttended, setClassesAttended] = useState(65);
  const [targetPercent, setTargetPercent] = useState(75);

  const result = useMemo(() => {
    return calculateAttendance(
      Number(classesHeld) || 0,
      Number(classesAttended) || 0,
      Number(targetPercent) || 75
    );
  }, [classesHeld, classesAttended, targetPercent]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Class Attendance Numbers</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Total Classes Held"
                type="number"
                value={classesHeld}
                onChange={setClassesHeld}
                min={1}
                max={1000}
                unit="classes"
              />
              <InputField
                label="Classes Attended"
                type="number"
                value={classesAttended}
                onChange={setClassesAttended}
                min={0}
                max={classesHeld}
                unit="classes"
              />
            </div>

            <InputField
              label="Target Eligibility Requirement"
              type="number"
              value={targetPercent}
              onChange={setTargetPercent}
              min={1}
              max={100}
              unit="%"
              subtext="NEB and Tribhuvan University standard minimum is 75%"
            />
          </div>

          <FormulaExplanation
            title="Attendance Rules in Nepal (NEB / TU / KU)"
            formula="Attendance % = (Classes Attended / Total Classes Held) × 100"
            notes={[
              'According to NEB examination regulations, a minimum of 75% attendance in each subject is compulsory to be eligible for board examinations.',
              'If attendance drops below 75%, colleges are required to declare the student unqualified (Expelled/Ineligible from regular exam form).',
            ]}
          />
          <SourceNotice source="National Examinations Board & Tribhuvan University Exam Bylaws" />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Attendance Status"
            primaryValue={`${result.currentPercent}%`}
            primaryUnit="Attendance"
            statusBadge={{
              label: result.status === 'eligible' ? 'Exam Eligible' : 'Attendance Shortage',
              variant: result.status === 'eligible' ? 'success' : 'danger',
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Current Attendance"
                value={`${result.currentPercent}%`}
                highlight={result.status === 'eligible' ? 'success' : 'danger'}
              />
              <ResultMetric
                label="Target Cutoff"
                value={`${result.targetPercent}%`}
              />
              {result.status === 'eligible' ? (
                <ResultMetric
                  label="Can Safely Miss"
                  value={result.canMissClasses}
                  unit="classes"
                  subtext={`To maintain ≥${targetPercent}%`}
                  highlight="accent"
                />
              ) : (
                <ResultMetric
                  label="Must Attend Next"
                  value={result.needToAttendConsecutive}
                  unit="consecutive"
                  subtext={`To recover to ${targetPercent}%`}
                  highlight="danger"
                />
              )}
              <ResultMetric
                label="Classes Missed"
                value={classesHeld - classesAttended}
                unit="classes"
              />
            </div>

            <div className="mt-4">
              {result.status === 'eligible' ? (
                <ValidationMessage
                  type="success"
                  title="Safe for Board Exam"
                  message={`You have satisfied the ${targetPercent}% attendance requirement. You can miss up to ${result.canMissClasses} more upcoming classes without falling below the cutoff.`}
                />
              ) : (
                <ValidationMessage
                  type="error"
                  title="Shortage Risk"
                  message={`Your attendance is currently below ${targetPercent}%. You need to attend ${result.needToAttendConsecutive} consecutive classes without missing any to regain eligibility.`}
                />
              )}
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
