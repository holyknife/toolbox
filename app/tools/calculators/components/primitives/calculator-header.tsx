'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { CalculatorItem } from '../../registry/calculators-registry';
import FavoriteButton from '@/components/favorite-button';

interface CalculatorHeaderProps {
  calculator: CalculatorItem;
}

export default function CalculatorHeader({ calculator }: CalculatorHeaderProps) {
  return (
    <div className="mb-4 pb-3 border-b border-border/70">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[12px] text-text-dim mb-2.5" aria-label="Breadcrumb">
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
            <FavoriteButton slug={calculator.slug} size={17} />
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
