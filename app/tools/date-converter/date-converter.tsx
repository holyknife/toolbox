'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowLeftRight, CalendarDays, Copy, RotateCcw } from 'lucide-react';
import WheelPicker from '@/components/WheelPicker';
import { AD_MONTHS, BS_MONTHS, MIN_AD_DATE, MAX_AD_DATE, MIN_BS_YEAR, MAX_BS_YEAR, adToBs, bsToAd, clampPickerDate, daysInMonth, numericDate, readableDate, todayInNepal, weekday, type Calendar, type CalendarDate } from './convert';

// Build straightforward numeric options for the year and day wheels.
function numberedOptions(first: number, last: number) {
  return Array.from({ length: last - first + 1 }, (_, index) => ({ value: first + index, label: String(first + index) }));
}

// The source date is the only date state; derive the other calendar to keep them in sync.
export default function DateConverter() {
  const [calendar, setCalendar] = useState<Calendar>('BS');
  const [date, setDate] = useState<CalendarDate>({ year: 2080, month: 1, day: 1 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Initialize after hydration so server/client time zones cannot cause a mismatch.
  useEffect(() => {
    try { setDate(adToBs(todayInNepal())); }
    catch { setError('Today is outside the supported range. Choose another date.'); }
  }, []);

  const resultCalendar: Calendar = calendar === 'BS' ? 'AD' : 'BS';
  const result = calendar === 'BS' ? bsToAd(date) : adToBs(date);
  const adDate = calendar === 'AD' ? date : result;
  const years = numberedOptions(calendar === 'BS' ? MIN_BS_YEAR : MIN_AD_DATE.year, calendar === 'BS' ? MAX_BS_YEAR : MAX_AD_DATE.year);
  const firstMonth = calendar === 'AD' && date.year === MIN_AD_DATE.year ? MIN_AD_DATE.month : 1;
  const lastMonth = calendar === 'AD' && date.year === MAX_AD_DATE.year ? MAX_AD_DATE.month : 12;
  const monthNames = calendar === 'BS' ? BS_MONTHS : AD_MONTHS;
  const months = numberedOptions(firstMonth, lastMonth).map(option => ({ value: option.value, label: monthNames[option.value - 1] }));
  const firstDay = calendar === 'AD' && date.year === MIN_AD_DATE.year && date.month === MIN_AD_DATE.month ? MIN_AD_DATE.day : 1;
  const lastDay = calendar === 'AD' && date.year === MAX_AD_DATE.year && date.month === MAX_AD_DATE.month ? MAX_AD_DATE.day : daysInMonth(calendar, date.year, date.month);
  const days = numberedOptions(firstDay, lastDay);

  // Clamp a disappearing day (such as day 32) when its year or month changes.
  function changePart(part: keyof CalendarDate, value: number) {
    setDate(previous => clampPickerDate(calendar, { ...previous, [part]: value }));
    setMessage('');
    setError('');
  }

  // Switching direction preserves the actual day instead of jumping to a second form.
  function changeDirection(nextCalendar: Calendar) {
    if (nextCalendar === calendar) return;
    setDate(result);
    setCalendar(nextCalendar);
    setMessage('');
    setError('');
  }

  // Today always means the current civil date in Nepal.
  function useToday() {
    try {
      const today = todayInNepal();
      const nepaliToday = adToBs(today);
      setDate(calendar === 'BS' ? nepaliToday : today);
      setMessage('Showing today in Nepal.');
      setError('');
    } catch { setError('Today is outside the supported calendar range.'); }
  }

  // Await clipboard permission and show a useful fallback if copying is unavailable.
  async function copyResult() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(`${readableDate(result, resultCalendar)} ${resultCalendar} (${numericDate(result)})`);
      setMessage('Result copied.');
      setError('');
    } catch { setError('Could not copy automatically. Select the result text and copy it manually.'); }
  }

  return <div className="page">
    <Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link>
    <div className="tool-heading"><span className="tool-icon"><CalendarDays size={28}/></span><div><h1>Date Converter</h1><p>Two calendars. One day.</p></div></div>
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_230px]">
      <section aria-label="BS and AD date converter" className="min-w-0 rounded-panel border border-border bg-panel p-5 sm:p-7">
        <div className="mb-7 flex items-center justify-between gap-3 text-sm text-dim"><span className="flex items-center gap-2"><span className="status-dot"/>Nepali date conversion</span><ArrowLeftRight size={16}/></div>
        <div role="group" aria-label="Conversion direction" className="mb-7 grid grid-cols-2 gap-1 rounded-xl border border-border bg-bg p-1">
          <button aria-pressed={calendar === 'BS'} onClick={() => changeDirection('BS')} className={`rounded-lg px-3 py-3 text-sm font-medium ${calendar === 'BS' ? 'bg-panel text-accent' : 'text-dim'}`}>BS to AD</button>
          <button aria-pressed={calendar === 'AD'} onClick={() => changeDirection('AD')} className={`rounded-lg px-3 py-3 text-sm font-medium ${calendar === 'AD' ? 'bg-panel text-accent' : 'text-dim'}`}>AD to BS</button>
        </div>
        <h2 className="mb-5 text-base font-medium">Choose a {calendar === 'BS' ? 'Nepali' : 'Gregorian'} date <span className="text-dim">({calendar})</span></h2>
        <div key={calendar} className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 sm:gap-4">
          <WheelPicker label="Year" value={date.year} options={years} onChange={value => changePart('year', value)}/>
          <WheelPicker label="Month" value={date.month} options={months} onChange={value => changePart('month', value)}/>
          <WheelPicker label="Day" value={date.day} options={days} onChange={value => changePart('day', value)}/>
        </div>
        <p className="mb-6 mt-4 text-center text-xs leading-relaxed text-dim">Drag, swipe, or scroll to spin. Tap a value to center it. Arrow keys work too.</p>
        <div className="date-result rounded-panel p-6 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest">Equivalent {resultCalendar} date</p>
          <div aria-live="polite" aria-atomic="true"><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{readableDate(result, resultCalendar)}</h2><p className="mt-2 text-sm">{weekday(adDate)} · {numericDate(result)} {resultCalendar}</p></div>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={useToday} className="flex items-center gap-2 rounded-lg border border-current px-4 py-2 text-sm font-medium"><RotateCcw size={14}/>Today</button><button onClick={copyResult} className="flex items-center gap-2 rounded-lg bg-panel px-4 py-2 text-sm font-medium text-accent"><Copy size={14}/>Copy result</button></div>
        </div>
        <p role="status" className="mt-4 min-h-5 text-center text-sm text-accent">{message}</p>
        {error && <p role="alert" className="error">{error}</p>}
      </section>
      <aside className="rounded-panel border border-border bg-panel p-5 xl:border-0 xl:bg-bg xl:p-0">
        <h2 className="mb-5 text-sm font-semibold">A quick calendar guide</h2>
        <h3 className="text-sm">Bikram Sambat · BS</h3><p className="mb-6 text-sm leading-relaxed text-dim">The Nepali calendar. Month lengths vary by year, so conversion uses a calendar table rather than a fixed year offset.</p>
        <h3 className="text-sm">Gregorian · AD</h3><p className="mb-6 text-sm leading-relaxed text-dim">The calendar used internationally. Switch direction to start with an English date.</p>
        <div className="border-t border-border pt-5 text-xs leading-loose text-dim"><p className="font-medium text-text">Supported dates</p><p>BS {MIN_BS_YEAR}-01-01 – {MAX_BS_YEAR}-12-{daysInMonth('BS', MAX_BS_YEAR, 12)}</p><p>AD {numericDate(MIN_AD_DATE)} – {numericDate(MAX_AD_DATE)}</p><p className="mt-3">Today follows Nepal time. Conversion runs locally.</p><a href="https://github.com/sonill/nepali-dates" target="_blank" rel="noreferrer" className="mt-3 inline-block text-accent underline">Calendar data source ↗</a></div>
      </aside>
    </div>
  </div>;
}
