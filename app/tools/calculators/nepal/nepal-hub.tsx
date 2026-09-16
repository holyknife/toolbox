'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Coins,
  Calendar,
  Compass,
  Zap,
} from 'lucide-react';
import {
  getNepalCalculators,
  getNepalCalculatorsBySection,
  NEPAL_SECTIONS,
  type CalculatorItem,
} from '../registry/calculators-registry';
import CalculatorIcon from '../components/calculator-icon';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  education: <GraduationCap size={18} className="text-blue-600 dark:text-blue-400" />,
  'money-tax': <Coins size={18} className="text-amber-600 dark:text-amber-400" />,
  'dates-calendar': <Calendar size={18} className="text-rose-600 dark:text-rose-400" />,
  'land-measurement': <Compass size={18} className="text-emerald-600 dark:text-emerald-400" />,
  utilities: <Zap size={18} className="text-cyan-600 dark:text-cyan-400" />,
};

export default function NepalHub() {
  const [query, setQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const nepalCalculators = useMemo(() => getNepalCalculators(), []);
  const sections = useMemo(() => getNepalCalculatorsBySection(), []);

  // Keyboard shortcut detection
  useEffect(() => {
    if (typeof window !== 'undefined' && /mac/i.test(navigator.userAgent)) {
      setIsMac(true);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered calculators when searching or filtering
  const filteredCalculators = useMemo(() => {
    let list = [...nepalCalculators];

    if (selectedSection !== 'all') {
      list = list.filter((c) => c.nepalCategory === selectedSection);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        return (
          c.title.toLowerCase().includes(q) ||
          c.shortTitle.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.version && c.version.toLowerCase().includes(q)) ||
          (c.ruleVersion && c.ruleVersion.toLowerCase().includes(q)) ||
          c.keywords.some((k) => k.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [nepalCalculators, selectedSection, query]);

  const clearSearch = () => {
    setQuery('');
    searchInputRef.current?.focus();
  };

  const renderCard = (c: CalculatorItem) => (
    <Link
      key={c.slug}
      href={c.routePath}
      className="group relative p-4 rounded-2xl bg-panel border border-border/80 hover:border-blue-500/50 dark:hover:border-blue-400/40 hover:shadow-xs transition-all flex flex-col justify-between min-h-[140px]"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.badgeClass} ${c.iconClass}`}
          >
            <CalculatorIcon name={c.iconName} size={20} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-dim">
              {c.category === 'Study & NEB' ? 'NEB' : c.category}
            </span>
            <div className="w-6 h-6 rounded-full bg-border/20 group-hover:bg-blue-600/10 dark:group-hover:bg-blue-400/15 flex items-center justify-center text-dim group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors m-0 leading-snug line-clamp-1">
          {c.title}
        </h3>

        <p className="text-xs text-dim line-clamp-2 m-0 mt-1.5 leading-relaxed">
          {c.description}
        </p>
      </div>

      {c.ruleVersion && (
        <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-dim">
          <span className="truncate">{c.ruleVersion}</span>
          {c.lastRuleUpdate && <span className="shrink-0 opacity-70">{c.lastRuleUpdate}</span>}
        </div>
      )}
    </Link>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-dim" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text transition-colors">
          Workspace
        </Link>
        <ChevronRight size={12} className="opacity-40" />
        <Link href="/tools/calculators" className="hover:text-text transition-colors">
          Calculators
        </Link>
        <ChevronRight size={12} className="opacity-40" />
        <span className="font-semibold text-text">Nepal</span>
      </nav>

      {/* Header aligned with visual style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-2xl border border-red-500/20 shrink-0 shadow-xs">
            🇳🇵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text m-0">
                Nepal Calculators
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                14 Tools
              </span>
            </div>
            <p className="text-xs sm:text-sm text-dim m-0 mt-1 max-w-2xl leading-relaxed">
              Official CDC Letter Grading 2078, FY 2081/82 salary tax slabs, Bikram Sambat dates, and Ropani/Bigha measurements.
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end text-xs text-dim/70 italic border-l border-border/70 pl-4 py-1 leading-tight">
          <span>Built for real use.</span>
          <span className="font-medium text-dim">Especially for Nepal.</span>
        </div>
      </div>

      {/* Switcher & Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/tools/calculators"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-dim hover:text-text transition-colors bg-panel border border-border px-3 py-1.5 rounded-xl hover:shadow-2xs"
          >
            <ArrowLeft size={13} />
            <span>All & General Calculators</span>
          </Link>

          <span className="text-xs text-dim">
            Official CDC & IRD standards
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-dim pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Nepal calculators... (e.g. SEE, Class 12, 2081/82 tax, Ropani, NEA)"
            className="w-full pl-11 pr-24 py-3 sm:py-3.5 rounded-2xl bg-panel border border-border text-text text-sm sm:text-base placeholder:text-dim/60 shadow-xs focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 rounded-md text-dim hover:text-text hover:bg-muted transition-colors"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-mono font-medium text-dim bg-muted rounded-md border border-border">
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </div>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedSection('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedSection === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-panel text-dim hover:text-text border border-border'
          }`}
        >
          All Nepal ({nepalCalculators.length})
        </button>
        {NEPAL_SECTIONS.map((sec) => {
          const isActive = selectedSection === sec.id;
          const count = nepalCalculators.filter((c) => c.nepalCategory === sec.id).length;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSelectedSection(sec.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-panel text-dim hover:text-text border border-border'
              }`}
            >
              {sec.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Content Rendering */}
      {query || selectedSection !== 'all' ? (
        // Flat filtered list
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text m-0">
              {query ? `Search Results (${filteredCalculators.length})` : 'Calculators'}
            </h2>
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>

          {filteredCalculators.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-panel border border-dashed border-border space-y-3">
              <p className="text-sm text-dim m-0">
                No Nepal calculators found matching &ldquo;{query}&rdquo;
              </p>
              <button
                type="button"
                onClick={clearSearch}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white"
              >
                Clear search query
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredCalculators.map(renderCard)}
            </div>
          )}
        </section>
      ) : (
        // 5 Structured Domain Sections
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} className="space-y-3.5">
              <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
                <div className="w-8 h-8 rounded-lg bg-panel border border-border/80 flex items-center justify-center">
                  {SECTION_ICONS[section.id]}
                </div>
                <div>
                  <h2 className="text-base font-bold text-text m-0 flex items-center gap-2">
                    <span>{section.title}</span>
                    <span className="text-xs font-medium text-dim">
                      ({section.items.length})
                    </span>
                  </h2>
                  <p className="text-xs text-dim m-0">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {section.items.map(renderCard)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
