'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Plus, Search } from 'lucide-react';
import { tools } from '@/lib/tools-registry';
import AnimatedGrid from './animated-grid';

// Search metadata and optional keywords so specialist calculators are discoverable too.
export default function ToolGrid() {
  const [query,setQuery] = useState('');
  const matches = tools.filter(tool => `${tool.name} ${tool.description} ${tool.category} ${tool.keywords?.join(' ') || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <div className="section-heading"><h2>All tools <span className="badge">{matches.length}</span></h2><span>A growing collection of useful things</span></div>
    <label className="mb-6 flex items-center gap-3 rounded-panel border border-border bg-panel px-4 py-3 text-dim"><Search size={18}/><span className="sr-only">Search tools</span><input type="search" className="w-full bg-panel text-text outline-none" placeholder="Search tools, calculators, images…" value={query} onChange={event => setQuery(event.target.value)}/></label>
    <AnimatedGrid visibleIds={[...matches.map(tool => tool.slug),...(!query.trim() ? ['coming-soon'] : [])]} items={[
      ...tools.map(t => ({id:t.slug,content:<Link href={`/tools/${t.slug}`} className="tool-card"><div className="card-top"><span className="tool-icon"><t.icon size={27} strokeWidth={1.7}/></span><ArrowUpRight size={21} className="card-arrow"/></div><span className="category">{t.category}</span><h3>{t.name}</h3><p>{t.description}</p><div className="card-bottom"><span>Open tool <ArrowRight size={15}/></span><span className="availability"><span className="status-dot"/>Ready to use</span></div></Link>})),
      {id:'coming-soon',content:<div className="coming-card"><span className="coming-icon"><Plus size={25} strokeWidth={1.4}/></span><h3>A little room for more.</h3><p>More everyday tools will find<br/>their home here.</p><span className="coming-label">THE TOOLKIT IS GROWING</span></div>},
    ]}/>
    {!matches.length && <p role="status" className="py-8 text-dim">No tools found. Try another name or category.</p>}
  </>;
}
