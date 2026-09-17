'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ChevronRight,
  Star,
  Sparkles,
} from 'lucide-react';
import {
  calculators,
  CALCULATOR_CATEGORIES,
  type CalculatorCategory,
  type CalculatorItem,
} from './registry/calculators-registry';
import CalculatorIcon from './components/calculator-icon';
import FavoriteButton from '@/components/favorite-button';
import { useFavorites } from '@/lib/favorites';
import { getMonthlyUsageLabel } from '@/lib/social-stats';

type SortOption = 'relevant' | 'alpha' | 'category';

export default function CalculatorsHub() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CalculatorCategory | 'Pinned'>('All');
  const [sortOption, setSortOption] = useState<SortOption>('relevant');
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { favorites, mounted } = useFavorites();
  const pinnedSlugs = useMemo(() => (mounted ? favorites : []), [favorites, mounted]);

  // Platform detection for ⌘K vs Ctrl K
  useEffect(() => {
    if (typeof window !== 'undefined' && /mac/i.test(navigator.userAgent)) {
      setIsMac(true);
    }
  }, []);

  // Global keyboard shortcut (⌘K / Ctrl+K)
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

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: calculators.length };
    calculators.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered & sorted calculators
  const filteredCalculators = useMemo(() => {
    let list = [...calculators];

    // Category filter
    if (selectedCategory === 'Pinned') {
      list = list.filter((c) => pinnedSlugs.includes(c.slug));
    } else if (selectedCategory !== 'All') {
      list = list.filter((c) => c.category === selectedCategory);
    }

    // Search query
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        return (
          c.title.toLowerCase().includes(q) ||
          c.shortTitle.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.keywords.some((k) => k.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    if (sortOption === 'alpha') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === 'category') {
      list.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    }

    return list;
  }, [selectedCategory, query, sortOption, pinnedSlugs]);

  const clearSearch = () => {
    setQuery('');
    searchInputRef.current?.focus();
  };

  const renderCard = (c: CalculatorItem) => {
    const usageLabel = getMonthlyUsageLabel(c.slug);

    return (
      <Link
        key={c.slug}
        href={c.routePath}
        className="group relative p-4 rounded-2xl bg-panel border border-border/80 hover:border-blue-500/50 dark:hover:border-blue-400/40 hover:shadow-xs transition-all flex flex-col justify-between min-h-[148px]"
      >
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton slug={c.slug} size={16} />
        </div>

        <div>
          <div className="flex items-start gap-2.5 mb-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.badgeClass} ${c.iconClass}`}
            >
              <CalculatorIcon name={c.iconName} size={19} />
            </div>
            <div className="pr-7">
              <span className="text-[10px] font-bold uppercase tracking-wider text-dim block">
                {c.category.toUpperCase()}
              </span>
              <h3 className="text-sm font-bold text-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors m-0 leading-snug">
                {c.title}
              </h3>
            </div>
          </div>

          <p className="text-xs text-dim line-clamp-2 m-0 mt-1 leading-relaxed">
            {c.description}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-text-dim/80 bg-muted/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            {usageLabel}
          </span>
          <div className="w-6 h-6 rounded-full bg-border/20 group-hover:bg-blue-600/10 dark:group-hover:bg-blue-400/15 flex items-center justify-center text-dim group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-dim" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text transition-colors">
          Workspace
        </Link>
        <span className="text-dim/50">/</span>
        <span className="font-semibold text-text">Calculators</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
            <CalculatorIcon name="Calculator" size={24} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text m-0">
              Calculators
            </h1>
            <p className="text-xs sm:text-sm text-dim m-0 mt-1 max-w-2xl leading-relaxed">
              Clean, accurate, and instant tools for everyday math, finance, currency conversion, health, dates, and GPA.
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end text-xs text-dim/80 border-l border-border/70 pl-4 py-1 leading-tight">
          <span className="font-semibold text-text">9 Essential Tools</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            94.2k uses this month
          </span>
        </div>
      </div>

      {/* Search Bar */}
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
          placeholder="Search calculators... (e.g. Percentage, Currency, Loan, GPA, BMI...)"
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

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {pinnedSlugs.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedCategory('Pinned')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'Pinned'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-panel text-dim hover:text-text border border-border'
            }`}
          >
            <Star size={13} className={selectedCategory === 'Pinned' ? 'fill-white' : 'fill-amber-500 text-amber-500'} />
            <span>Pinned ({pinnedSlugs.filter((s) => calculators.some((c) => c.slug === s)).length})</span>
          </button>
        )}

        {CALCULATOR_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-panel text-dim hover:text-text border border-border'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Calculators Grid */}
      <section className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-text m-0">
            {query
              ? `Search Results (${filteredCalculators.length})`
              : selectedCategory === 'Pinned'
              ? 'Pinned Calculators'
              : selectedCategory === 'All'
              ? 'All Calculators'
              : `${selectedCategory} Calculators`}
          </h2>

          <div className="flex items-center gap-2 text-xs text-dim self-end sm:self-auto">
            <span>Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-panel border border-border rounded-lg px-2.5 py-1 text-xs text-text font-medium focus:outline-hidden"
            >
              <option value="relevant">Default</option>
              <option value="alpha">Alphabetical (A–Z)</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {filteredCalculators.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-panel border border-dashed border-border space-y-3">
            <p className="text-sm text-dim m-0">
              {selectedCategory === 'Pinned'
                ? 'You have not pinned any calculators yet. Click the star on any card to pin it!'
                : `No calculators found matching "${query}"`}
            </p>
            <button
              type="button"
              onClick={() => {
                clearSearch();
                setSelectedCategory('All');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Show all calculators
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCalculators.map(renderCard)}
          </div>
        )}
      </section>
    </div>
  );
}
