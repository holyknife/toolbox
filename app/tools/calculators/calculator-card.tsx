'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator as CalcIcon,
  Percent,
  Users,
  Receipt,
  TrendingUp,
  LineChart,
  Heart,
  Crop,
  CalendarRange,
  Calendar,
  CreditCard,
  GraduationCap,
  FileSpreadsheet,
  type LucideIcon,
} from 'lucide-react';
import type { Calculator } from './calculators-registry';

export interface CalculatorMeta {
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
  tag: string;
  filterCategory: string;
  glowClass?: string;
}


export const calculatorMetaMap: Record<string, CalculatorMeta> = {
  basic: {
    icon: CalcIcon,
    badgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/70 dark:border-cyan-800/40',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    tag: 'Everyday',
    filterCategory: 'Everyday',
    glowClass: 'hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/15',
  },
  discount: {
    icon: Percent,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/40',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    tag: 'Money',
    filterCategory: 'Money',
    glowClass: 'hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/15',
  },
  tip: {
    icon: Users,
    badgeClass: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200/70 dark:border-pink-800/40',
    iconClass: 'text-pink-600 dark:text-pink-400',
    tag: 'Everyday',
    filterCategory: 'Everyday',
    glowClass: 'hover:shadow-pink-500/10 dark:hover:shadow-pink-500/15',
  },
  tax: {
    icon: Receipt,
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/40',
    iconClass: 'text-amber-600 dark:text-amber-400',
    tag: 'Money',
    filterCategory: 'Money',
    glowClass: 'hover:shadow-amber-500/10 dark:hover:shadow-amber-500/15',
  },
  'profit-margin': {
    icon: TrendingUp,
    badgeClass: 'bg-green-50 dark:bg-green-950/40 border-green-200/70 dark:border-green-800/40',
    iconClass: 'text-green-600 dark:text-green-400',
    tag: 'Money',
    filterCategory: 'Money',
    glowClass: 'hover:shadow-green-500/10 dark:hover:shadow-green-500/15',
  },
  'simple-interest': {
    icon: LineChart,
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-800/40',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    tag: 'Money',
    filterCategory: 'Money',
    glowClass: 'hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/15',
  },
  bmi: {
    icon: Heart,
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-800/40',
    iconClass: 'text-rose-600 dark:text-rose-400',
    tag: 'Health',
    filterCategory: 'Health',
    glowClass: 'hover:shadow-rose-500/10 dark:hover:shadow-rose-500/15',
  },
  'aspect-ratio': {
    icon: Crop,
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/70 dark:border-sky-800/40',
    iconClass: 'text-sky-600 dark:text-sky-400',
    tag: 'Design',
    filterCategory: 'Design',
    glowClass: 'hover:shadow-sky-500/10 dark:hover:shadow-sky-500/15',
  },
  'date-difference': {
    icon: CalendarRange,
    badgeClass: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/70 dark:border-orange-800/40',
    iconClass: 'text-orange-600 dark:text-orange-400',
    tag: 'Dates',
    filterCategory: 'Date & Time',
    glowClass: 'hover:shadow-orange-500/10 dark:hover:shadow-orange-500/15',
  },
  age: {
    icon: Calendar,
    badgeClass: 'bg-red-50 dark:bg-red-950/40 border-red-200/70 dark:border-red-800/40',
    iconClass: 'text-red-600 dark:text-red-400',
    tag: 'Dates',
    filterCategory: 'Date & Time',
    glowClass: 'hover:shadow-red-500/10 dark:hover:shadow-red-500/15',
  },
  'compound-interest': {
    icon: TrendingUp,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/40',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    tag: 'Money',
    filterCategory: 'Money',
    glowClass: 'hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/15',
  },
  'loan-emi': {
    icon: CreditCard,
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/70 dark:border-purple-800/40',
    iconClass: 'text-purple-600 dark:text-purple-400',
    tag: 'Money',
    filterCategory: 'Money',
    glowClass: 'hover:shadow-purple-500/10 dark:hover:shadow-purple-500/15',
  },
  gpa: {
    icon: GraduationCap,
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/40',
    iconClass: 'text-blue-600 dark:text-blue-400',
    tag: 'Study',
    filterCategory: 'Study',
    glowClass: 'hover:shadow-blue-500/10 dark:hover:shadow-blue-500/15',
  },
  grade: {
    icon: FileSpreadsheet,
    badgeClass: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200/70 dark:border-violet-800/40',
    iconClass: 'text-violet-600 dark:text-violet-400',
    tag: 'Study',
    filterCategory: 'Study',
    glowClass: 'hover:shadow-violet-500/10 dark:hover:shadow-violet-500/15',
  },
};

const defaultMeta: CalculatorMeta = {
  icon: CalcIcon,
  badgeClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/40',
  iconClass: 'text-blue-600 dark:text-blue-400',
  tag: 'Utility',
  filterCategory: 'All',
  glowClass: '',
};

interface CalculatorCardProps {
  calculator: Calculator;
  featured?: boolean;
  onClick?: () => void;
}

export default function CalculatorCard({ calculator, featured = false, onClick }: CalculatorCardProps) {
  const meta = calculatorMetaMap[calculator.slug] ?? defaultMeta;
  const Icon = meta.icon;

  if (featured) {
    return (
      <Link
        href={`/tools/calculators/${calculator.slug}`}
        onClick={onClick}
        className={`group relative flex items-start gap-4 p-5 rounded-2xl border border-border bg-panel text-text transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg ${meta.glowClass || ''}`}
      >
        <div
          className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center border ${meta.badgeClass} ${meta.iconClass} transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:rotate-[-2deg]`}
        >
          <Icon size={26} strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0 pr-8">
          <span className="inline-block text-[11px] font-semibold text-text-dim tracking-wider uppercase mb-1">
            {meta.tag}
          </span>
          <h3 className="text-[16px] font-bold text-text tracking-tight group-hover:text-accent transition-colors duration-200 truncate">
            {calculator.name}
          </h3>
          <p className="text-[13px] text-text-dim line-clamp-2 leading-relaxed mt-1">
            {calculator.description}
          </p>
        </div>

        <div className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border/80 bg-muted/40 flex items-center justify-center text-text-dim transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent group-hover:border-accent group-hover:bg-accent-soft">
          <ArrowRight size={15} strokeWidth={2.2} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/tools/calculators/${calculator.slug}`}
      onClick={onClick}
      className={`group relative flex items-center gap-3.5 p-4 rounded-xl border border-border bg-panel text-text transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-accent/40 hover:shadow-md ${meta.glowClass || ''}`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center border ${meta.badgeClass} ${meta.iconClass} transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:rotate-[-2deg]`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0 pr-7">
        <span className="block text-[10px] font-semibold text-text-dim tracking-wider uppercase leading-none mb-1">
          {meta.tag}
        </span>
        <h4 className="text-[14px] font-semibold text-text tracking-tight group-hover:text-accent transition-colors duration-150 truncate">
          {calculator.name}
        </h4>
        <p className="text-[12px] text-text-dim line-clamp-1 leading-snug mt-0.5">
          {calculator.description}
        </p>
      </div>

      <div className="absolute right-3.5 w-7 h-7 rounded-full border border-border/70 bg-muted/30 flex items-center justify-center text-text-dim transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent group-hover:border-accent group-hover:bg-accent-soft">
        <ArrowRight size={13} strokeWidth={2.2} />
      </div>
    </Link>
  );
}
