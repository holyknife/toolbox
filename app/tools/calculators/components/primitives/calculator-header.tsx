'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';
import type { CalculatorItem } from '../../registry/calculators-registry';

interface CalculatorHeaderProps {
  calculator: CalculatorItem;
}

export default function CalculatorHeader({ calculator }: CalculatorHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b border-border/70">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[12px] text-text-dim mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text transition-colors">
          Workspace
        </Link>
        <ChevronRight size={12} className="opacity-40" />
        <Link href="/tools/calculators" className="hover:text-text transition-colors">
          Calculators
        </Link>
        <ChevronRight size={12} className="opacity-40" />
        <span className="font-semibold text-text truncate">{calculator.shortTitle}</span>
      </nav>

      {/* Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text m-0">
              {calculator.title}
            </h1>
            {calculator.nepalSpecific && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-800/40">
                <MapPin size={11} />
                <span>Nepal</span>
              </span>
            )}
            {calculator.version && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-text-dim border border-border">
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span>{calculator.version}</span>
              </span>
            )}
          </div>
          <p className="text-[13px] sm:text-[14px] text-text-dim m-0 max-w-2xl leading-relaxed">
            {calculator.description}
          </p>
        </div>

        <Link
          href="/tools/calculators"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-dim hover:text-accent transition-colors self-start sm:self-center flex-shrink-0"
        >
          <ArrowLeft size={14} />
          <span>All calculators</span>
        </Link>
      </div>
    </div>
  );
}
