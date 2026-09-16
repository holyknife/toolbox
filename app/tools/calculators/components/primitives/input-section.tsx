'use client';

import React from 'react';

export interface InputFieldProps {
  id?: string;
  label: string;
  subtext?: string;
  value: string | number;
  onChange: (val: any) => void;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  prefix?: string;
  suffix?: string;
  unit?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function InputField({
  id,
  label,
  subtext,
  value,
  onChange,
  type = 'number',
  placeholder,
  min,
  max,
  step = 'any',
  prefix,
  suffix,
  unit,
  disabled = false,
  required = false,
  className = '',
}: InputFieldProps) {
  const inputId = id || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const effectiveSuffix = unit || suffix;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs sm:text-sm font-semibold text-text select-none">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        {subtext && <span className="text-[11px] text-text-dim">{subtext}</span>}
      </div>

      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-xs sm:text-sm text-text-dim font-medium pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (type === 'number') {
              const parsed = parseFloat(val);
              onChange(isNaN(parsed) ? val : parsed);
            } else {
              onChange(val);
            }
          }}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`w-full py-2.5 rounded-xl border border-border bg-card text-xs sm:text-sm text-text outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-60 shadow-xs ${
            prefix ? 'pl-8' : 'pl-3.5'
          } ${effectiveSuffix ? 'pr-14' : 'pr-3.5'}`}
        />
        {effectiveSuffix && (
          <span className="absolute right-3 text-xs text-text-dim font-medium pointer-events-none select-none">
            {effectiveSuffix}
          </span>
        )}
      </div>
    </div>
  );
}

export interface SelectFieldProps {
  id?: string;
  label: string;
  subtext?: string;
  value: string;
  onChange: (val: any) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function SelectField({
  id,
  label,
  subtext,
  value,
  onChange,
  options,
  className = '',
}: SelectFieldProps) {
  const selectId = id || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={selectId} className="text-xs sm:text-sm font-semibold text-text select-none">
          {label}
        </label>
        {subtext && <span className="text-[11px] text-text-dim">{subtext}</span>}
      </div>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs sm:text-sm text-text outline-none transition-all duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 shadow-xs cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default InputField;
