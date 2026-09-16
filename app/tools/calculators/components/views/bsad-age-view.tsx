'use client';

import React, { useState, useMemo } from 'react';
import { calculateAge } from '../../engines/everyday-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField, { SelectField } from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { getCalculatorBySlug } from '../../registry/calculators-registry';

export default function BsadAgeView() {
  const calculator = getCalculatorBySlug('bs-ad-age')!;

  const [calendar, setCalendar] = useState<'BS' | 'AD'>('BS');
  const [year, setYear] = useState(2058);
  const [month, setMonth] = useState(5);
  const [day, setDay] = useState(15);

  const result = useMemo(() => {
    return calculateAge(
      { year: Number(year) || 2058, month: Number(month) || 1, day: Number(day) || 1 },
      calendar
    );
  }, [year, month, day, calendar]);

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
                setCalendar('BS');
                setYear(2058);
                setMonth(5);
                setDay(15);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                calendar === 'BS' ? 'bg-card text-text shadow-xs' : 'text-text-dim hover:text-text'
              }`}
            >
              Bikram Sambat (BS / वि.सं.)
            </button>
            <button
              type="button"
              onClick={() => {
                setCalendar('AD');
                setYear(2001);
                setMonth(8);
                setDay(31);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                calendar === 'AD' ? 'bg-card text-text shadow-xs' : 'text-text-dim hover:text-text'
              }`}
            >
              Gregorian (AD / ई.सं.)
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
            title="Exact Nepal Calendar Conversion"
            notes={[
              'Uses the official Nepal Government Patro dataset (BS 1970 to 2100).',
              'Converts BS to Gregorian AD with exact day counts per Nepali month (which range between 29 to 32 days).',
              'Computes completed calendar years, months, days, total elapsed days, day of the week, and countdown to next birthday.',
            ]}
          />
          <SourceNotice source="Official Bikram Sambat Ephemeris & Nepal Government Panchanga Nirnayak Samiti" />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Exact Age"
            primaryValue={`${result.years} Years`}
            primaryUnit={`${result.months}m ${result.days}d`}
            statusBadge={{
              label: `Born on ${result.dayOfWeek}`,
              variant: 'success',
            }}
            shareSummary={`Age: ${result.years} years, ${result.months} months, ${result.days} days (Born ${result.dayOfWeek}, BS: ${result.bsDob.year}-${result.bsDob.month}-${result.bsDob.day})`}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Total Days Lived"
                value={result.totalDays.toLocaleString()}
                unit="days"
                highlight="accent"
              />
              <ResultMetric
                label="Next Birthday In"
                value={result.nextBirthdayDays}
                unit="days"
                highlight="success"
              />
              <ResultMetric
                label="Date in BS (वि.सं.)"
                value={`${result.bsDob.year}/${result.bsDob.month}/${result.bsDob.day}`}
              />
              <ResultMetric
                label="Date in AD (ई.सं.)"
                value={`${result.adDob.year}/${result.adDob.month}/${result.adDob.day}`}
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
