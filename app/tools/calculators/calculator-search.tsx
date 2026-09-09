'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
import { calculators } from './calculators-registry';

// The same searchable list serves the hub and quick switching inside every calculator.
export default function CalculatorSearch({ compact = false }: { compact?: boolean }) {
  const [query,setQuery] = useState('');
  const matches = calculators.filter(calculator => `${calculator.name} ${calculator.description} ${calculator.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className={compact ? 'mb-7' : 'mt-10'}>
    <label className="mb-2 flex flex-col gap-2 text-sm text-dim sm:flex-row sm:items-center"><span className="flex items-center gap-2"><Search size={16}/>{compact ? 'Find another calculator' : 'Search calculators'}</span>
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try EMI, GPA, age…" className="w-full min-w-0 flex-1 rounded-panel border border-border bg-panel px-3 py-3 text-text outline-none focus:border-accent"/></label>
    {(!compact || query) && <>
      <p className="mb-4 text-xs text-dim">{matches.length} calculators · ordered from simple to more involved</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{matches.map(calculator => <Link key={calculator.slug} href={`/tools/calculators/${calculator.slug}`} onClick={() => setQuery('')} className="rounded-panel border border-border bg-panel p-4 hover:border-accent">
        <div className="flex items-center justify-between gap-2"><span className="text-xs text-dim">{String(calculators.indexOf(calculator) + 1).padStart(2,'0')} · {calculator.category}</span><ArrowUpRight size={16} className="text-accent"/></div>
        <h3 className="mt-3 font-semibold text-text">{calculator.name}</h3><p className="mt-2 text-sm text-dim">{calculator.description}</p>
      </Link>)}</div>
      {!matches.length && <p role="status" className="py-5 text-sm text-dim">No calculators match. Try another search.</p>}
    </>}
  </div>;
}
