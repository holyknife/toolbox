'use client';

import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';

export interface WheelOption { value: number; label: string }
interface Props { label: string; value: number; options: WheelOption[]; onChange: (value: number) => void }

// Share one wheel implementation for year/month/day, including keyboard access.
export default function DateWheel({ label, value, options, onChange }: Props) {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionKey = options.map(option => option.value).join(',');

  // Read the actual row height so scrolling works with enlarged browser text.
  function rowHeight(): number {
    return container.current?.querySelector<HTMLElement>('[role="option"]')?.offsetHeight || 44;
  }

  // Sync external changes (Today, direction, shorter months) without smooth-scroll races.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const values = optionKey.split(',').map(Number);
    const index = Math.max(0, values.indexOf(value));
    container.current?.scrollTo({ top: index * rowHeight(), behavior: 'instant' });
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value, optionKey]);

  // Commit a settled scroll position instead of rebuilding the wheel on every pixel.
  function handleScroll() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const index = Math.max(0, Math.min(options.length - 1, Math.round((container.current?.scrollTop || 0) / rowHeight())));
      const selected = options[index];
      if (selected && selected.value !== value) onChange(selected.value);
    }, 160);
  }

  // Arrows step one item; Page/Home/End make long year lists practical without a mouse.
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex(option => option.value === value);
    let nextIndex = index;
    if (event.key === 'ArrowDown') nextIndex += 1;
    else if (event.key === 'ArrowUp') nextIndex -= 1;
    else if (event.key === 'PageDown') nextIndex += 10;
    else if (event.key === 'PageUp') nextIndex -= 10;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else return;
    event.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    onChange(options[Math.max(0, Math.min(options.length - 1, nextIndex))].value);
  }

  return <div className="min-w-0"><div id={`${id}-label`} className="mb-3 text-center text-sm font-medium text-dim">{label}</div>
    <div className="date-wheel-frame"><div className="date-wheel-selection" aria-hidden="true"/>
      <div ref={container} className="date-wheel" role="listbox" tabIndex={0} aria-labelledby={`${id}-label`} aria-activedescendant={`${id}-${value}`} onScroll={handleScroll} onKeyDown={handleKey}>
        {options.map(option => <div key={option.value} id={`${id}-${option.value}`} role="option" aria-selected={option.value === value} className={`date-wheel-item ${option.value === value ? 'text-accent font-semibold' : 'text-dim'}`} onClick={() => { if (timer.current) clearTimeout(timer.current); onChange(option.value); container.current?.focus(); }}>{option.label}</div>)}
      </div>
    </div>
  </div>;
}
