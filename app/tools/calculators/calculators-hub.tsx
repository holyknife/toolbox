'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Calculator as CalcIcon,
  Search,
  X,
  Star,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { calculators, type Calculator } from './calculators-registry';
import CalculatorCard, { calculatorMetaMap } from './calculator-card';

const popularSlugs = ['loan-emi', 'discount', 'gpa'];

const categoryTabs = [
  { id: 'All', label: 'All' },
  { id: 'Money', label: 'Money' },
  { id: 'Date & Time', label: 'Date & Time' },
  { id: 'Study', label: 'Study' },
  { id: 'Health', label: 'Health' },
  { id: 'Design', label: 'Design' },
] as const;

type SortOption = 'simple' | 'alpha' | 'popular';

export default function CalculatorsHub() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<SortOption>('simple');
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect platform for keyboard shortcut display (⌘K vs Ctrl K)
  useEffect(() => {
    if (typeof window !== 'undefined' && /mac/i.test(navigator.userAgent)) {
      setIsMac(true);
    }
  }, []);

  // Global Ctrl+K / Cmd+K listener to focus search input
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

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: calculators.length,
      Money: 0,
      'Date & Time': 0,
      Study: 0,
      Health: 0,
      Design: 0,
    };

    for (const c of calculators) {
      const meta = calculatorMetaMap[c.slug];
      if (meta?.filterCategory && counts[meta.filterCategory] !== undefined) {
        counts[meta.filterCategory]++;
      }
    }
    return counts;
  }, []);

  // Filtered calculators
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();

    return calculators.filter(calc => {
      const meta = calculatorMetaMap[calc.slug];
      const matchesCat =
        selectedCategory === 'All' ||
        meta?.filterCategory === selectedCategory;

      if (!matchesCat) return false;

      if (!q) return true;

      const searchableText = `${calc.name} ${calc.description} ${calc.category} ${meta?.tag ?? ''} ${meta?.filterCategory ?? ''} ${calc.slug}`.toLowerCase();
      return searchableText.includes(q);
    });
  }, [query, selectedCategory]);

  // Sorted calculators
  const sortedMatches = useMemo(() => {
    const list = [...matches];
    if (sortOption === 'alpha') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortOption === 'popular') {
      return list.sort((a, b) => {
        const aPop = popularSlugs.indexOf(a.slug);
        const bPop = popularSlugs.indexOf(b.slug);
        if (aPop !== -1 && bPop !== -1) return aPop - bPop;
        if (aPop !== -1) return -1;
        if (bPop !== -1) return 1;
        return 0;
      });
    }
    return list; // 'simple' maintains curated order from calculators-registry
  }, [matches, sortOption]);

  // Featured popular calculators matching current search
  const popularCalculators = useMemo(() => {
    return popularSlugs
      .map(slug => calculators.find(c => c.slug === slug))
      .filter((c): c is Calculator => Boolean(c))
      .filter(c => matches.some(m => m.slug === c.slug));
  }, [matches]);

  const scrollToAll = () => {
    const el = document.getElementById('all-calculators');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto pb-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[13px] text-text-dim mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text transition-colors">
          Workspace
        </Link>
        <ChevronRight size={13} className="opacity-50" />
        <span className="font-semibold text-text">Calculators</span>
      </nav>

      {/* Header Row: Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0 shadow-sm">
            <CalcIcon size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text m-0">
              Calculators
            </h1>
            <p className="text-[13px] sm:text-[14px] text-text-dim mt-1 m-0">
              Find the right calculator for everyday, money, study, health, and dates.
            </p>
          </div>
        </div>

        {/* Search Bar with Ctrl+K shortcut */}
        <div className="relative w-full md:w-80 lg:w-96 flex-shrink-0">
          <label htmlFor="calculator-search" className="sr-only">
            Search calculators
          </label>
          <div className="relative flex items-center">
            <Search
              size={18}
              className="absolute left-3.5 text-text-dim pointer-events-none transition-colors"
            />
            <input
              ref={searchInputRef}
              id="calculator-search"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search calculators... (EMI, GPA, age)"
              className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-border bg-panel text-[13px] text-text placeholder:text-text-dim/80 outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-border/80 shadow-sm"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-text-dim hover:text-text hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-text-dim bg-muted border border-border rounded pointer-events-none select-none">
                  {isMac ? '⌘K' : 'Ctrl K'}
                </kbd>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Result Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-border/70 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="tablist" aria-label="Calculator Categories">
          {categoryTabs.map(tab => {
            const isSelected = selectedCategory === tab.id;
            const count = categoryCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 flex-shrink-0 flex items-center gap-1.5 select-none ${
                  isSelected
                    ? 'bg-accent text-accent-contrast shadow-sm scale-[1.02]'
                    : 'bg-panel border border-border text-text hover:bg-muted hover:border-border/90'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[11px] opacity-80 ${isSelected ? 'text-accent-contrast' : 'text-text-dim'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[12px] text-text-dim whitespace-nowrap">
          <span>{matches.length} calculators</span>
          <span className="mx-1.5">•</span>
          <span>ordered from simple to more involved</span>
        </div>
      </div>

      {/* Popular Calculators Section */}
      {popularCalculators.length > 0 && (
        <section className="mb-12" aria-labelledby="popular-calculators-title">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Star size={20} className="text-amber-500 fill-amber-400" />
              <div>
                <h2 id="popular-calculators-title" className="text-[17px] font-bold text-text tracking-tight m-0">
                  Popular calculators
                </h2>
                <p className="text-[12px] text-text-dim m-0">
                  Most useful calculators, ready when you need them.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToAll}
              className="text-[12px] font-semibold text-accent hover:underline flex items-center gap-1 transition-all group"
            >
              <span>See all calculators</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popularCalculators.map(calc => (
              <CalculatorCard key={calc.slug} calculator={calc} featured />
            ))}
          </div>
        </section>
      )}

      {/* All Calculators Section */}
      <section id="all-calculators" aria-labelledby="all-calculators-title">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 id="all-calculators-title" className="text-[18px] font-bold text-text tracking-tight m-0">
              All calculators
            </h2>
            <p className="text-[12px] text-text-dim mt-0.5 m-0">
              Explore our complete collection of {calculators.length} calculators.
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="relative inline-flex items-center">
            <label htmlFor="calculator-sort" className="sr-only">Sort calculators</label>
            <div className="flex items-center gap-2 bg-panel border border-border rounded-lg px-3 py-1.5 text-[12px] text-text hover:border-border/90 shadow-sm cursor-pointer">
              <span className="text-text-dim">Sort:</span>
              <select
                id="calculator-sort"
                value={sortOption}
                onChange={e => setSortOption(e.target.value as SortOption)}
                className="bg-transparent border-0 text-text font-medium outline-none cursor-pointer pr-4 appearance-none"
              >
                <option value="simple" className="bg-panel text-text">Simple to advanced</option>
                <option value="alpha" className="bg-panel text-text">Alphabetical (A-Z)</option>
                <option value="popular" className="bg-panel text-text">Popular first</option>
              </select>
              <ChevronDown size={14} className="text-text-dim pointer-events-none -ml-3" />
            </div>
          </div>
        </div>

        {/* Grid of All Matching Calculators */}
        {sortedMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {sortedMatches.map(calc => (
              <CalculatorCard key={calc.slug} calculator={calc} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-panel/50">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-text-dim mb-3">
              <Search size={22} />
            </div>
            <h3 className="text-base font-semibold text-text mb-1">No calculators match your search</h3>
            <p className="text-sm text-text-dim max-w-sm mx-auto mb-4">
              Try searching by other keywords (e.g. loan, percentage, tax, age, bmi) or clear the search filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCategory('All');
                searchInputRef.current?.focus();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-contrast hover:filter hover:brightness-95 transition-all"
            >
              <RotateCcw size={14} />
              <span>Reset search & filters</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
