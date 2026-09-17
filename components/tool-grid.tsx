'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Star, X } from 'lucide-react';
import { tools, type Tool } from '@/lib/tools-registry';
import AnimatedGrid from './animated-grid';
import { CommandTrigger } from './command-palette';
import ToolArtwork from './tool-artwork';
import FavoriteButton from './favorite-button';
import { useFavorites } from '@/lib/favorites';
import { getMonthlyUsageLabel } from '@/lib/social-stats';

const baseCategories = ['All', 'Language', 'Utilities', 'Converters', 'Internet'] as const;
type Category = (typeof baseCategories)[number] | 'Pinned';

const presentation: Record<string, { category: (typeof baseCategories)[number]; description: string }> = {
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

function ToolCard({ tool }: { tool: Tool }) {
  const detail = presentation[tool.slug] ?? { category: tool.category, description: tool.description };
  const isFeatured = featured.includes(tool.slug);
  const usageLabel = getMonthlyUsageLabel(tool.slug);

  return (
    <Link href={`/tools/${tool.slug}`} className={`tool-card directory-card featured-card feature-${tool.slug} relative`}>
      <div className="absolute top-3.5 right-3.5 z-20">
        <FavoriteButton slug={tool.slug} size={17} />
      </div>
      <span className="tool-icon">
        {tool.slug === 'nepali-typing' ? <span className="nepali-symbol">अ</span> : <tool.icon size={29} strokeWidth={1.8}/>}
      </span>
      <div className="directory-card-copy">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="category m-0">{detail.category}</span>
          <span className="text-[11px] font-medium text-text-dim/80 bg-muted/60 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            {usageLabel}
          </span>
        </div>
        <h3>{tool.name}</h3>
        <p>{detail.description}</p>
      </div>
      {tool.slug === 'calculators' && (
        <div className="feature-art calculator-art" aria-hidden="true">
          <div className="mini-calculator">
            <div className="mini-display">128</div>
            <div className="mini-keys">
              {['7','8','9','4','5','6','1','2','3','+','0','='].map(key => (
                <span key={key}>{key}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      {tool.slug === 'nepali-typing' && (
        <div className="feature-art typing-art" aria-hidden="true">
          <span className="keyboard-key key-back">क</span>
          <span className="keyboard-key key-main">अ</span>
          <span className="keyboard-key key-front">म</span>
        </div>
      )}
      <span className="card-arrow"><ArrowRight size={18}/></span>
      {!isFeatured && <ToolArtwork slug={tool.slug}/>}
    </Link>
  );
}

export default function ToolGrid() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const { favorites, mounted } = useFavorites();

  const pinnedSlugs = useMemo(() => (mounted ? favorites : []), [favorites, mounted]);

  const ordered = useMemo(() => {
    // When "All" is active and user has pinned tools, pin them to the top of the list!
    const pinnedTools = tools.filter(t => pinnedSlugs.includes(t.slug));
    const unpinnedTools = tools.filter(t => !pinnedSlugs.includes(t.slug));
    const featuredPinned = pinnedTools.filter(t => featured.includes(t.slug));
    const standardPinned = pinnedTools.filter(t => !featured.includes(t.slug));
    const featuredUnpinned = unpinnedTools.filter(t => featured.includes(t.slug));
    const standardUnpinned = unpinnedTools.filter(t => !featured.includes(t.slug));

    return [...featuredPinned, ...standardPinned, ...featuredUnpinned, ...standardUnpinned];
  }, [pinnedSlugs]);

  const matches = ordered.filter(tool => {
    const detail = presentation[tool.slug];
    const categoryMatch =
      category === 'All'
        ? true
        : category === 'Pinned'
        ? pinnedSlugs.includes(tool.slug)
        : (detail?.category ?? tool.category) === category;

    return (
      categoryMatch &&
      `${tool.name} ${tool.description} ${tool.category} ${detail?.category ?? ''} ${tool.keywords?.join(' ') || ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    );
  });

  return (
    <>
      <div className="directory-heading">
        <div>
          <h1>All tools</h1>
          <span className="directory-count">{tools.length} utilities</span>
        </div>
        <p className="flex items-center gap-2">
          <span>Simple tools. Real use.</span>
          <span className="text-xs text-text-dim/80 bg-muted/60 px-2 py-0.5 rounded-full">
            ⚡ 350k+ uses this month
          </span>
        </p>
      </div>
      <div className="directory-search">
        <label>
          <Search size={22}/>
          <span className="sr-only">Search tools</span>
          <input
            type="search"
            placeholder="Search tools... (e.g. calculator, QR code, image...)"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <CommandTrigger compact/>
      </div>
      <div className="category-filters" role="group" aria-label="Filter tools by category">
        {pinnedSlugs.length > 0 && (
          <button
            type="button"
            aria-pressed={category === 'Pinned'}
            className={`flex items-center gap-1.5 ${category === 'Pinned' ? 'selected' : ''}`}
            onClick={() => setCategory('Pinned')}
          >
            <Star size={13} className="fill-amber-500 text-amber-500" />
            <span>Pinned ({pinnedSlugs.length})</span>
          </button>
        )}
        {baseCategories.map(item => (
          <button
            type="button"
            key={item}
            aria-pressed={category === item}
            className={category === item ? 'selected' : ''}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <span className="sr-only" role="status">{matches.length} tools found</span>
      <AnimatedGrid
        visibleIds={matches.map(tool => tool.slug)}
        items={ordered.map(tool => ({ id: tool.slug, content: <ToolCard tool={tool}/> }))}
      />
      {!matches.length && (
        <div className="directory-empty">
          <Search size={28}/>
          <h2>No tools found</h2>
          <p>
            {category === 'Pinned'
              ? 'You have not pinned any tools yet. Click the star on any card to pin it!'
              : 'Try another search or choose a different category.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
          >
            <X size={16}/>Clear filters
          </button>
        </div>
      )}
    </>
  );
}
