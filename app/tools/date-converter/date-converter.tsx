'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  Calendar,
  Copy,
  Check,
  RotateCcw,
  Info,
  Globe,
  Clock,
  BarChart3
} from 'lucide-react';
import WheelPicker from '@/components/WheelPicker';
import {
  AD_MONTHS,
  BS_MONTHS,
  MIN_AD_DATE,
  MAX_AD_DATE,
  MIN_BS_YEAR,
  MAX_BS_YEAR,
  adToBs,
  bsToAd,
  clampPickerDate,
  daysInMonth,
  numericDate,
  readableDate,
  todayInNepal,
  weekday,
  type Calendar as CalendarType,
  type CalendarDate
} from './convert';

// Build straightforward numeric options for the year and day wheels.
function numberedOptions(first: number, last: number) {
  return Array.from({ length: last - first + 1 }, (_, index) => ({ value: first + index, label: String(first + index) }));
}

// The source date is the only date state; derive the other calendar to keep them in sync.
export default function DateConverter() {
  const [calendar, setCalendar] = useState<CalendarType>('BS');
  const [date, setDate] = useState<CalendarDate>({ year: 2080, month: 1, day: 1 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [todayState, setTodayState] = useState<{ ad: CalendarDate; bs: CalendarDate } | null>(null);

  // Initialize after hydration so server/client time zones cannot cause a mismatch.
  useEffect(() => {
    try {
      const today = todayInNepal();
      const nepaliToday = adToBs(today);
      setDate(nepaliToday);
      setTodayState({ ad: today, bs: nepaliToday });
    } catch {
      setError('Today is outside the supported range. Choose another date.');
    }
  }, []);

  const resultCalendar: CalendarType = calendar === 'BS' ? 'AD' : 'BS';
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
  function changeDirection(nextCalendar: CalendarType) {
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
    } catch {
      setError('Today is outside the supported calendar range.');
    }
  }

  // Await clipboard permission and show a useful fallback if copying is unavailable.
  async function copyResult() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(`${readableDate(result, resultCalendar)} ${resultCalendar} (${numericDate(result)})`);
      setCopied(true);
      setMessage('Result copied.');
      setError('');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy automatically. Select the result text and copy it manually.');
    }
  }

  const todayBsStr = todayState ? `${numericDate(todayState.bs)} (${BS_MONTHS[todayState.bs.month - 1]} ${todayState.bs.day})` : 'Loading…';
  const todayAdStr = todayState ? `${numericDate(todayState.ad)} (${weekday(todayState.ad)})` : 'Loading…';

  return <div className="page date-converter-page">
    <Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link>
    <div className="tool-heading">
      <span className="tool-icon date-tool-icon"><CalendarDays size={28}/></span>
      <div>
        <h1>Date Converter</h1>
        <p>Convert between BS and AD, clearly and instantly.</p>
      </div>
    </div>

    <div className="date-converter-layout">
      {/* Main Conversion Studio */}
      <section aria-label="BS and AD date converter" className="date-converter-panel">
        {/* Top Direction Bar */}
        <div className="date-converter-nav">
          <div role="group" aria-label="Conversion direction" className="date-direction-pills">
            <button
              type="button"
              aria-pressed={calendar === 'BS'}
              onClick={() => changeDirection('BS')}
              className={`date-direction-pill ${calendar === 'BS' ? 'is-active' : ''}`}
            >
              BS to AD
            </button>
            <button
              type="button"
              aria-pressed={calendar === 'AD'}
              onClick={() => changeDirection('AD')}
              className={`date-direction-pill ${calendar === 'AD' ? 'is-active' : ''}`}
            >
              AD to BS
            </button>
          </div>
          <button
            type="button"
            className="date-swap-btn"
            onClick={() => changeDirection(calendar === 'BS' ? 'AD' : 'BS')}
            title="Swap conversion direction"
            aria-label="Swap conversion direction"
          >
            <ArrowLeftRight size={16} />
          </button>
        </div>

        {/* Selection Subtitle with Glowing Dot */}
        <div className="date-select-indicator">
          <span className="indicator-dot" />
          <span>Select a {calendar === 'BS' ? 'Nepali date (BS)' : 'Gregorian date (AD)'}</span>
        </div>

        {/* 3 Wheel Picker Cards */}
        <div key={calendar} className="date-pickers-grid">
          <WheelPicker
            label="Year"
            icon={<Calendar size={14} />}
            value={date.year}
            options={years}
            onChange={value => changePart('year', value)}
          />
          <WheelPicker
            label="Month"
            icon={<Calendar size={14} />}
            value={date.month}
            options={months}
            onChange={value => changePart('month', value)}
          />
          <WheelPicker
            label="Day"
            icon={<Calendar size={14} />}
            value={date.day}
            options={days}
            onChange={value => changePart('day', value)}
          />
        </div>

        {/* Instructions Caption */}
        <div className="date-instructions">
          <Info size={14} />
          <span>Scroll to select a value, or use arrow keys. The date will convert automatically.</span>
        </div>

        {/* Output Result Card */}
        <div className="date-result-card">
          <svg className="date-result-wave" viewBox="0 0 500 140" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(56, 94, 232, 0.04)" />
                <stop offset="60%" stopColor="rgba(70, 115, 255, 0.12)" />
                <stop offset="100%" stopColor="rgba(90, 140, 255, 0.22)" />
              </linearGradient>
            </defs>
            <path d="M 0 140 Q 150 140 240 100 T 500 45 L 500 140 Z" fill="url(#wave-grad)" />
          </svg>

          <div className="date-result-top">
            <div className="date-result-icon">
              <CalendarDays size={24} />
            </div>
            <div className="date-result-info">
              <span className="date-result-label">Equivalent {resultCalendar} date</span>
              <div aria-live="polite" aria-atomic="true">
                <h2 className="date-result-heading">{readableDate(result, resultCalendar)}</h2>
                <p className="date-result-sub">{weekday(adDate)} · {numericDate(result)} {resultCalendar}</p>
              </div>
            </div>
            <div className="date-result-actions">
              <button
                type="button"
                onClick={useToday}
                className="date-action-btn"
                title="Jump to today's date in Nepal"
              >
                <RotateCcw size={13} />
                <span>Today</span>
              </button>
              <button
                type="button"
                onClick={copyResult}
                className="date-action-btn is-primary"
                title="Copy converted date"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="date-result-meta">
            <div className="meta-item">
              <span className="meta-icon"><Globe size={15} /></span>
              <div>
                <span className="meta-label">Conversion</span>
                <strong className="meta-val">
                  {calendar === 'BS' ? 'Bikram Sambat (BS) → Gregorian (AD)' : 'Gregorian (AD) → Bikram Sambat (BS)'}
                </strong>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon"><Clock size={15} /></span>
              <div>
                <span className="meta-label">Today (BS)</span>
                <strong className="meta-val">{todayBsStr}</strong>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon"><Calendar size={15} /></span>
              <div>
                <span className="meta-label">Today (AD)</span>
                <strong className="meta-val">{todayAdStr}</strong>
              </div>
            </div>
          </div>
        </div>

        {message && <p role="status" className="date-status-message">{message}</p>}
        {error && <p role="alert" className="error">{error}</p>}
      </section>

      {/* Calendar Guide Aside */}
      <aside className="calendar-guide-aside" aria-label="Calendar guide">
        <h2 className="guide-heading">Calendar guide</h2>

        <div className="guide-card">
          <div className="guide-card-top">
            <span className="guide-badge guide-badge-blue">
              <CalendarDays size={18} />
            </span>
            <h3>Bikram Sambat (BS)</h3>
          </div>
          <p>
            The Nepali calendar. Month lengths vary by year, so conversion uses a calendar table rather than a fixed year offset.
          </p>
        </div>

        <div className="guide-card">
          <div className="guide-card-top">
            <span className="guide-badge guide-badge-purple">
              <Globe size={18} />
            </span>
            <h3>Gregorian (AD)</h3>
          </div>
          <p>
            The calendar used internationally. Switch direction to convert from an English date to Nepali date.
          </p>
        </div>

        <div className="guide-card">
          <div className="guide-card-top">
            <span className="guide-badge guide-badge-green">
              <BarChart3 size={18} />
            </span>
            <h3>Supported range</h3>
          </div>
          <div className="guide-card-body">
            <p className="guide-mono">BS {MIN_BS_YEAR}-01-01 – {MAX_BS_YEAR}-12-{daysInMonth('BS', MAX_BS_YEAR, 12)}</p>
            <p className="guide-mono">AD {numericDate(MIN_AD_DATE)} – {numericDate(MAX_AD_DATE)}</p>
            <p className="guide-note">Today follows Nepal time.<br />Conversion runs locally.</p>
          </div>
        </div>
      </aside>
    </div>
  </div>;
}

