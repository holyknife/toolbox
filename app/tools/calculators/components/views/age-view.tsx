'use client';

import React, { useState, useMemo } from 'react';
import { calculateAge } from '../../engines/everyday-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import { getCalculatorBySlug } from '../../registry/calculators-registry';

export default function AgeView() {
  const calculator = getCalculatorBySlug('age')!;

  const [calendar, setCalendar] = useState<'AD' | 'BS'>('AD');
  const [year, setYear] = useState(2000);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);

  const result = useMemo(() => {
    return calculateAge(
      { year: Number(year) || 2000, month: Number(month) || 1, day: Number(day) || 1 },
      calendar
    );
  }, [year, month, day, calendar]);

  const totalWeeks = Math.floor(result.totalDays / 7);
  const totalHours = result.totalDays * 24;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Calendar Picker Tabs */}
          <div className="flex gap-2 p-1.5 rounded-xl bg-muted/40 border border-border">
            <button
              type="button"
              onClick={() => {
                setCalendar('AD');
                setYear(2000);
                setMonth(1);
                setDay(1);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                calendar === 'AD' ? 'bg-card text-text shadow-xs' : 'text-text-dim hover:text-text'
              }`}
            >
              Standard Calendar (AD / Gregorian)
            </button>
            <button
              type="button"
              onClick={() => {
                setCalendar('BS');
                setYear(2056);
                setMonth(9);
                setDay(17);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                calendar === 'BS' ? 'bg-card text-text shadow-xs' : 'text-text-dim hover:text-text'
              }`}
            >
              Nepali Calendar (BS / वि.सं.)
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Date of Birth</h2>

            <div className="grid grid-cols-3 gap-3">
              <InputField
                label={calendar === 'BS' ? 'Year (वि.सं.)' : 'Year (AD)'}
                type="number"
                value={year}
                onChange={setYear}
                min={calendar === 'BS' ? 1970 : 1913}
                max={calendar === 'BS' ? 2100 : 2043}
              />
              <InputField
                label="Month (1–12)"
                type="number"
                value={month}
                onChange={setMonth}
                min={1}
                max={12}
              />
              <InputField
                label="Day (1–32)"
                type="number"
                value={day}
                onChange={setDay}
                min={1}
                max={32}
              />
            </div>
          </div>

          <FormulaExplanation
            title="How Exact Age is Calculated"
            notes={[
              'Computes completed calendar years, months, and days based on elapsed calendar intervals.',
              'Calculates day of the week on which you were born and exact countdown to your next birthday.',
              'Seamlessly maps between Bikram Sambat (BS) and Gregorian (AD) calendars.',
            ]}
          />

          {/* Life Milestones breakdown */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim m-0">
              Total Life Milestones
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[11px] text-text-dim block">Total Weeks</span>
                <span className="text-base font-bold text-text">{totalWeeks.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[11px] text-text-dim block">Total Days</span>
                <span className="text-base font-bold text-text">{result.totalDays.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-text-dim block">Approx. Hours</span>
                <span className="text-base font-bold text-text">{totalHours.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Exact Age"
            primaryValue={`${result.years} Years`}
            primaryUnit={`${result.months}m ${result.days}d`}
            statusBadge={{
              label: `Born on ${result.dayOfWeek}`,
              variant: 'success',
            }}
            shareSummary={`Age: ${result.years} years, ${result.months} months, ${result.days} days (Born ${result.dayOfWeek})`}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Next Birthday"
                value={`${result.nextBirthdayDays} days`}
                highlight="success"
              />
              <ResultMetric
                label="Total Days"
                value={result.totalDays.toLocaleString()}
                highlight="accent"
              />
              <ResultMetric
                label="Date in AD"
                value={`${result.adDob.year}/${result.adDob.month}/${result.adDob.day}`}
              />
              <ResultMetric
                label="Date in BS"
                value={`${result.bsDob.year}/${result.bsDob.month}/${result.bsDob.day}`}
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
