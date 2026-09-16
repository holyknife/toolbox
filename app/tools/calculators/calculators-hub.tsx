'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  calculators,
  CALCULATOR_CATEGORIES,
  type CalculatorCategory,
  type CalculatorItem,
} from './registry/calculators-registry';
import CalculatorIcon from './components/calculator-icon';

type SortOption = 'relevant' | 'alpha' | 'category';

export default function CalculatorsHub() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CalculatorCategory>('All');
  const [sortOption, setSortOption] = useState<SortOption>('relevant');
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Featured 4 calculators exactly matching reference image
  const featuredCalculators = useMemo(() => {
    const featuredSlugs = ['see-gpa', 'neb-class-12-gpa', 'bs-ad-age', 'loan-emi'];
    return featuredSlugs
      .map((s) => calculators.find((c) => c.slug === s))
      .filter((c): c is CalculatorItem => Boolean(c));
  }, []);

  // Filtered & sorted calculators
  const filteredCalculators = useMemo(() => {
    let list = [...calculators];

    // Category filter
    if (selectedCategory !== 'All') {
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
  }, [selectedCategory, query, sortOption]);

  const clearSearch = () => {
    setQuery('');
    searchInputRef.current?.focus();
  };

  const renderCard = (c: CalculatorItem) => (
    <Link
      key={c.slug}
      href={c.routePath}
      className="group relative p-4 rounded-2xl bg-panel border border-border/80 hover:border-blue-500/50 dark:hover:border-blue-400/40 hover:shadow-xs transition-all flex flex-col justify-between min-h-[136px]"
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
              {c.category === 'Study & NEB' ? 'STUDY & NEB' : c.category.toUpperCase()}
            </span>
            <div className="w-6 h-6 rounded-full bg-border/20 group-hover:bg-blue-600/10 dark:group-hover:bg-blue-400/15 flex items-center justify-center text-dim group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors m-0 leading-snug line-clamp-1">
          {c.shortTitle || c.title}
        </h3>

        <p className="text-xs text-dim line-clamp-2 m-0 mt-1 leading-relaxed">
          {c.description}
        </p>
      </div>
    </Link>
  );

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

      {/* Header matching reference image */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="3" />
              <line x1="7" x2="7.01" y1="7" y2="7" strokeWidth="2.5" />
              <line x1="12" x2="12.01" y1="7" y2="7" strokeWidth="2.5" />
              <line x1="17" x2="17.01" y1="7" y2="7" strokeWidth="2.5" />
              <line x1="7" x2="7.01" y1="12" y2="12" strokeWidth="2.5" />
              <line x1="12" x2="12.01" y1="12" y2="12" strokeWidth="2.5" />
              <line x1="17" x2="17.01" y1="12" y2="12" strokeWidth="2.5" />
              <line x1="7" x2="7.01" y1="17" y2="17" strokeWidth="2.5" />
              <line x1="12" x2="12.01" y1="17" y2="17" strokeWidth="2.5" />
              <line x1="17" x2="17.01" y1="17" y2="17" strokeWidth="2.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text m-0">
              Calculators
            </h1>
            <p className="text-xs sm:text-sm text-dim m-0 mt-1 max-w-2xl leading-relaxed">
              Useful calculators for students, professionals, and everyday life. Simple. Accurate. Free.
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end text-xs text-dim/70 italic border-l border-border/70 pl-4 py-1 leading-tight">
          <span>Built for real use.</span>
          <span className="font-medium text-dim">Especially for Nepal.</span>
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
          placeholder="Search calculators... (e.g. GPA, VAT, EMI, age...)"
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

      {/* Two Distinct Collections Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* General Calculators Card */}
        <div className="p-4 rounded-2xl bg-panel border border-border/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                <Sparkles size={11} />
                <span>General Collection • 12 Tools</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-text m-0">General Calculators</h3>
            <p className="text-xs text-dim m-0 mt-1 leading-relaxed">
              Daily productivity, loan EMI, discounts, interest, attendance, tip, BMI, and ratio tools.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-dim">
            <span className="font-medium text-text">Standard & Everyday tools</span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Browsing below ↓</span>
          </div>
        </div>

        {/* Nepal-Specific Calculators Card */}
        <Link
          href="/tools/calculators/nepal"
          className="group p-4 rounded-2xl bg-panel border border-border/80 hover:border-red-500/40 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1">
                <span>🇳🇵</span>
                <span>Nepal Suite • 14 Tools</span>
              </span>
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                <span>Dedicated Hub</span>
                <ArrowRight size={12} />
              </span>
            </div>
            <h3 className="text-base font-bold text-text group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors m-0">
              Nepal-Specific Calculators
            </h3>
            <p className="text-xs text-dim m-0 mt-1 leading-relaxed">
              SEE & Class 12 NEB GPA, CDC Letter Grading 2078, FY 2081/82 tax slabs, Bikram Sambat dates, and Ropani/Bigha land units.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-dim">
            <span className="font-medium text-text">CDC 2078 & IRD Rules</span>
            <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">Open Nepal Hub →</span>
          </div>
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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

      {/* "Featured for you" Row (Visible when not searching and on 'All' category) */}
      {!query && selectedCategory === 'All' && (
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text m-0">Featured for you</h2>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('all-calculators-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>View all calculators</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {featuredCalculators.map(renderCard)}
          </div>
        </section>
      )}

      {/* "All calculators" Section */}
      <section id="all-calculators-section" className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-text m-0">
            {query ? `Search Results (${filteredCalculators.length})` : 'All calculators'}
          </h2>

          <div className="flex items-center gap-2 text-xs text-dim self-end sm:self-auto">
            <span>Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-panel border border-border rounded-lg px-2.5 py-1 text-xs text-text font-medium focus:outline-hidden"
            >
              <option value="relevant">Most relevant</option>
              <option value="alpha">Alphabetical (A–Z)</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {filteredCalculators.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-panel border border-dashed border-border space-y-3">
            <p className="text-sm text-dim m-0">
              No calculators found matching &ldquo;{query}&rdquo;
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
    </div>
  );
}
