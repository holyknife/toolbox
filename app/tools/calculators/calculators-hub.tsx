'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  MapPin,
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

  // Featured 4 calculators for "Most used" row
  const featuredCalculators = useMemo(() => {
    const slugs = ['see-gpa', 'see-gpa-planner', 'neb-class-12-planner', 'loan-emi'];
    return slugs
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-text-dim" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text transition-colors">
          Workspace
        </Link>
        <ChevronRight size={12} className="opacity-40" />
        <span className="font-semibold text-text">Calculators</span>
      </nav>

      {/* Header with Title and Counter */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text m-0">
            Calculators
          </h1>
          <p className="text-sm sm:text-base text-text-dim m-0 mt-1">
            Nepal-first calculators for study, money, dates, and everyday use.
          </p>
        </div>
        <div className="text-xs font-semibold text-text-dim self-start sm:self-auto bg-muted/50 px-2.5 py-1 rounded-full border border-border/60">
          {calculators.length} calculators
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search NEB GPA, EMI, VAT, age..."
          className="w-full pl-11 pr-24 py-3 sm:py-3.5 rounded-2xl bg-card border border-border/80 text-text text-sm sm:text-base placeholder:text-text-dim/60 shadow-xs focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 rounded-md text-text-dim hover:text-text hover:bg-muted transition-colors"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-mono font-medium text-text-dim bg-muted/80 rounded-md border border-border">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CALCULATOR_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-card text-text-dim hover:text-text hover:bg-muted/60 border border-border/70'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* "Most used" Row (Visible when not searching and on 'All' category) */}
      {!query && selectedCategory === 'All' && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text m-0">Most used</h2>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('all-calculators-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>See all</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {featuredCalculators.map((c) => (
              <Link
                key={c.slug}
                href={`/tools/calculators/${c.slug}`}
                className="group relative p-4 rounded-2xl bg-card border border-border/80 hover:border-blue-500/60 dark:hover:border-blue-500/40 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.badgeClass} ${c.iconClass}`}
                    >
                      <CalculatorIcon name={c.iconName} size={20} />
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-text-dim/50 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all mt-1"
                    />
                  </div>

                  <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                    {c.category === 'Study & NEB' ? 'NEB' : c.category}
                  </div>

                  <h3 className="text-sm font-bold text-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors m-0 mb-1 leading-snug">
                    {c.title}
                  </h3>

                  <p className="text-xs text-text-dim line-clamp-2 m-0 leading-relaxed">
                    {c.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* "All calculators" Section */}
      <section id="all-calculators-section" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-text m-0">
            {query ? `Search Results (${filteredCalculators.length})` : 'All calculators'}
          </h2>

          <div className="flex items-center gap-2 text-xs text-text-dim self-end sm:self-auto">
            <span>Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-text font-medium focus:outline-hidden"
            >
              <option value="relevant">Most relevant</option>
              <option value="alpha">Alphabetical (A–Z)</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {filteredCalculators.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-card border border-dashed border-border space-y-3">
            <p className="text-sm text-text-dim m-0">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCalculators.map((c) => (
              <Link
                key={c.slug}
                href={`/tools/calculators/${c.slug}`}
                className="group p-3.5 rounded-2xl bg-card border border-border/80 hover:border-border hover:bg-muted/20 hover:shadow-xs transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.badgeClass} ${c.iconClass}`}
                  >
                    <CalculatorIcon name={c.iconName} size={19} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {c.category}
                      </span>
                      {c.nepalSpecific && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                          <MapPin size={8} />
                          <span>Nepal</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors m-0 truncate">
                      {c.title}
                    </h3>

                    <p className="text-[11px] text-text-dim truncate m-0 mt-0.5">
                      {c.description}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={15}
                  className="text-text-dim/40 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
