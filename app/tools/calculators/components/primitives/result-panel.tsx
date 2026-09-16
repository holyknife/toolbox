'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import ShareResult from './share-result';

export interface ResultPanelProps {
  title?: string;
  primaryValue?: string | number;
  primaryUnit?: string;
  primaryLabel?: string;
  statusText?: string;
  statusType?: 'success' | 'warning' | 'danger' | 'neutral' | 'default';
  statusBadge?: {
    label: string;
    variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'default' | string;
  };
  onReset?: () => void;
  shareText?: string;
  shareSummary?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function ResultPanel({
  title = 'Calculation Result',
  primaryValue,
  primaryUnit,
  primaryLabel,
  statusText,
  statusType = 'neutral',
  statusBadge,
  onReset,
  shareText,
  shareSummary,
  children,
  className = '',
}: ResultPanelProps) {
  const effectiveStatusText = statusBadge?.label || statusText;
  const rawVariant = statusBadge?.variant || statusType;
  const effectiveVariant: 'success' | 'warning' | 'danger' | 'neutral' =
    rawVariant === 'default' ? 'neutral' : (rawVariant as any) || 'neutral';

  const statusStyles = {
    success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    neutral: 'bg-muted text-text-dim border-border',
  };

  const effectiveShare = shareSummary || shareText;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border border-border/80 bg-card text-text shadow-xs flex flex-col gap-4 ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/70">
        <h2 className="text-sm sm:text-base font-bold text-text tracking-tight m-0">
          {title}
        </h2>
        <div className="flex items-center gap-1.5">
          {effectiveShare && <ShareResult text={effectiveShare} />}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="p-1.5 rounded-lg text-text-dim hover:text-text hover:bg-muted transition-colors"
              title="Reset inputs to defaults"
              aria-label="Reset inputs to defaults"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Primary Metric Card */}
      {primaryValue !== undefined && (
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-baseline justify-between gap-2">
          <div>
            {primaryLabel && (
              <span className="text-[11px] font-semibold text-text-dim uppercase tracking-wider block mb-1">
                {primaryLabel}
              </span>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-text">
                {primaryValue}
              </span>
              {primaryUnit && (
                <span className="text-xs sm:text-sm font-semibold text-text-dim">
                  {primaryUnit}
                </span>
              )}
            </div>
          </div>

          {effectiveStatusText && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusStyles[effectiveVariant] || statusStyles.neutral}`}
            >
              {effectiveStatusText}
            </span>
          )}
        </div>
      )}

      {/* Custom Body & Breakdown */}
      {children}
    </div>
  );
}
