'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Search, Star, X } from 'lucide-react';
import { tools, type Tool } from '@/lib/tools-registry';
import AnimatedGrid from './animated-grid';
import { CommandTrigger } from './command-palette';
import ToolArtwork from './tool-artwork';
import FavoriteButton from './favorite-button';
import { useFavorites, useRecentTools } from '@/lib/favorites';

const baseCategories = ['All', 'Language', 'Utilities', 'Converters', 'Internet'] as const;
type Category = (typeof baseCategories)[number] | 'Pinned' | 'Recent';

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

  return (
    <Link href={`/tools/${tool.slug}`} className={`tool-card directory-card featured-card feature-${tool.slug} relative`}>
      <div className="absolute top-3.5 right-3.5 z-20">
        <FavoriteButton slug={tool.slug} size={17} />
      </div>
      <span className="tool-icon">
        {tool.slug === 'nepali-typing' ? <span className="nepali-symbol">अ</span> : <tool.icon size={29} strokeWidth={1.8}/>}
      </span>
      <div className="directory-card-copy">
        <span className="category mb-1 block">{detail.category}</span>
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
  const { favorites, mounted: favMounted } = useFavorites();
  const { recentTools, mounted: recentMounted } = useRecentTools(12);
  const mounted = favMounted && recentMounted;

  const pinnedSlugs = useMemo(() => (mounted ? favorites : []), [favorites, mounted]);
  const recentSlugs = useMemo(() => (mounted ? recentTools.map(r => r.tool.slug) : []), [recentTools, mounted]);

  const ordered = useMemo(() => {
    if (category === 'Recent') {
      const recentList = recentTools.map(r => r.tool);
      const remaining = tools.filter(t => !recentSlugs.includes(t.slug));
      return [...recentList, ...remaining];
    }

    // When "All" is active and user has pinned tools, pin them to the top of the list!
    const pinnedTools = tools.filter(t => pinnedSlugs.includes(t.slug));
    const unpinnedTools = tools.filter(t => !pinnedSlugs.includes(t.slug));
    const featuredPinned = pinnedTools.filter(t => featured.includes(t.slug));
    const standardPinned = pinnedTools.filter(t => !featured.includes(t.slug));
    const featuredUnpinned = unpinnedTools.filter(t => featured.includes(t.slug));
    const standardUnpinned = unpinnedTools.filter(t => !featured.includes(t.slug));

    return [...featuredPinned, ...standardPinned, ...featuredUnpinned, ...standardUnpinned];
  }, [pinnedSlugs, recentSlugs, recentTools, category]);

  const matches = ordered.filter(tool => {
    const detail = presentation[tool.slug];
    const categoryMatch =
      category === 'All'
        ? true
        : category === 'Pinned'
        ? pinnedSlugs.includes(tool.slug)
        : category === 'Recent'
        ? recentSlugs.includes(tool.slug)
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
        <p>Simple tools. Real use.</p>
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
      {mounted && recentTools.length > 0 && category === 'All' && !query && (
        <div className="flex items-center gap-2 text-xs text-dim overflow-x-auto pb-1 mb-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase shrink-0">
            <Clock size={12} className="text-accent" /> Recent:
          </span>
          {recentTools.slice(0, 4).map(({ tool }) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 text-xs text-text hover:border-accent hover:text-accent transition-colors shrink-0"
            >
              <tool.icon size={12} />
              <span>{tool.name}</span>
            </Link>
          ))}
        </div>
      )}
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
        {recentSlugs.length > 0 && (
          <button
            type="button"
            aria-pressed={category === 'Recent'}
            className={`flex items-center gap-1.5 ${category === 'Recent' ? 'selected' : ''}`}
            onClick={() => setCategory('Recent')}
          >
            <Clock size={13} className="text-accent" />
            <span>Recent ({recentSlugs.length})</span>
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
              : category === 'Recent'
              ? 'You have not used any tools yet. Open any tool and it will appear here!'
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
