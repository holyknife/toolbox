'use client';

import React from 'react';

interface ResultMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  highlight?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export default function ResultMetric({
  label,
  value,
  unit,
  subtext,
  highlight = 'default',
  size = 'md',
}: ResultMetricProps) {
  const highlightStyles = {
    default: 'text-text',
    accent: 'text-blue-600 dark:text-blue-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  const sizeStyles = {
    sm: 'text-base font-bold',
    md: 'text-xl sm:text-2xl font-black',
    lg: 'text-2xl sm:text-3xl font-black',
  };

  return (
    <div className="p-3 sm:p-3.5 rounded-xl bg-card border border-border/70 hover:border-border transition-colors">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-dim mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`${sizeStyles[size]} ${highlightStyles[highlight]} tracking-tight font-mono`}>
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-text-dim">{unit}</span>}
      </div>
      {subtext && (
        <div className="text-[11px] text-text-dim/80 mt-1">
          {subtext}
        </div>
      )}
    </div>
  );
}
