'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, X } from 'lucide-react';
import { tools, type Tool } from '@/lib/tools-registry';
import AnimatedGrid from './animated-grid';
import { CommandTrigger } from './command-palette';

const categories = ['All', 'Language', 'Utilities', 'Converters', 'Internet'] as const;
type Category = typeof categories[number];
const presentation: Record<string, { category: Category; description: string }> = {
  calculators: { category: 'Utilities', description: 'Quick calculations for money, grades, health, dates and more.' },
  'nepali-typing': { category: 'Language', description: 'Type in Nepali easily and comfortably.' },
  'word-generator': { category: 'Language', description: 'Random English or Nepali words with one tap.' },
  'preeti-to-unicode': { category: 'Converters', description: 'Convert Preeti font to Unicode in seconds.' },
  'speed-test': { category: 'Internet', description: 'Check your internet speed, upload and ping.' },
  'photo-compressor': { category: 'Utilities', description: 'Compress images to a size that works for you.' },
  'date-converter': { category: 'Converters', description: 'Convert dates between Nepali and English calendars.' },
  'qr-generator': { category: 'Utilities', description: 'Create QR codes for links, WiFi and more.' },
};
const featured = ['calculators', 'nepali-typing'];
const ordered = [...tools.filter(t => featured.includes(t.slug)), ...tools.filter(t => !featured.includes(t.slug))];

function ToolCard({ tool }: { tool: Tool }) {
  const detail = presentation[tool.slug] ?? { category: tool.category, description: tool.description };
  const isFeatured = featured.includes(tool.slug);
  return <Link href={`/tools/${tool.slug}`} className={`tool-card directory-card ${isFeatured ? `featured-card feature-${tool.slug}` : ''}`}>
    <span className="tool-icon">{tool.slug === 'nepali-typing' ? <span className="nepali-symbol">अ</span> : <tool.icon size={29} strokeWidth={1.8}/>}</span>
    <div className="directory-card-copy"><span className="category">{detail.category}</span><h3>{tool.name}</h3><p>{detail.description}</p></div>
    {tool.slug === 'calculators' && <div className="feature-art calculator-art" aria-hidden="true"><div className="mini-calculator"><div className="mini-display">128</div><div className="mini-keys">{['7','8','9','4','5','6','1','2','3','+','0','='].map(key => <span key={key}>{key}</span>)}</div></div></div>}
    {tool.slug === 'nepali-typing' && <div className="feature-art typing-art" aria-hidden="true"><span className="keyboard-key key-back">क</span><span className="keyboard-key key-main">अ</span><span className="keyboard-key key-front">म</span></div>}
    <span className="card-arrow"><ArrowRight size={18}/></span>
  </Link>;
}

export default function ToolGrid() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const matches = ordered.filter(tool => {
    const detail = presentation[tool.slug];
    return (category === 'All' || (detail?.category ?? tool.category) === category)
      && `${tool.name} ${tool.description} ${tool.category} ${detail?.category ?? ''} ${tool.keywords?.join(' ') || ''}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  return <>
    <div className="directory-heading"><div><h1>All tools</h1><span className="directory-count">{tools.length} utilities</span></div><p>Simple tools. Real use.</p></div>
    <div className="directory-search"><label><Search size={22}/><span className="sr-only">Search tools</span><input type="search" placeholder="Search tools... (e.g. calculator, QR code, image...)" value={query} onChange={event => setQuery(event.target.value)}/></label><CommandTrigger compact/></div>
    <div className="category-filters" role="group" aria-label="Filter tools by category">{categories.map(item => <button type="button" key={item} aria-pressed={category === item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <span className="sr-only" role="status">{matches.length} tools found</span>
    <AnimatedGrid visibleIds={matches.map(tool => tool.slug)} items={ordered.map(tool => ({ id: tool.slug, content: <ToolCard tool={tool}/> }))}/>
    {!matches.length && <div className="directory-empty"><Search size={28}/><h2>No tools found</h2><p>Try another search or choose a different category.</p><button type="button" onClick={() => { setQuery(''); setCategory('All'); }}><X size={16}/>Clear filters</button></div>}
  </>;
}
