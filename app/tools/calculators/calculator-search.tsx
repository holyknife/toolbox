'use client';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { calculators } from './calculators-registry';
import CalculatorCard from './calculator-card';

// Quick switching and search inside every calculator.
export default function CalculatorSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('');
  const matches = calculators.filter(calculator =>
    `${calculator.name} ${calculator.description} ${calculator.category}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  return (
    <div className={compact ? 'mb-8' : 'mt-10'}>
      <div className="relative flex items-center mb-3">
        <Search size={16} className="absolute left-3.5 text-text-dim pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={compact ? 'Switch to another calculator... (e.g. EMI, GPA, age)' : 'Search calculators...'}
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-panel text-xs sm:text-sm text-text placeholder:text-text-dim/80 outline-none transition-all duration-150 focus:border-accent shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 text-text-dim hover:text-text"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {(!compact || query) && (
        <>
          <p className="mb-3 text-xs text-text-dim">
            {matches.length} calculators · ordered from simple to more involved
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map(calculator => (
              <CalculatorCard
                key={calculator.slug}
                calculator={calculator}
                onClick={() => setQuery('')}
              />
            ))}
          </div>
          {!matches.length && (
            <p role="status" className="py-4 text-xs text-text-dim text-center">
              No calculators match &quot;{query}&quot;. Try another search.
            </p>
          )}
        </>
      )}
    </div>
  );
}
