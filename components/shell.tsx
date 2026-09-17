'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Box, Grid2X2, Moon, Sun } from 'lucide-react';
import { tools } from '@/lib/tools-registry';
import CommandPalette, { CommandTrigger } from './command-palette';
import FavoriteButton from './favorite-button';
import { recordToolUsage } from '@/lib/favorites';

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';

  function toggleTheme() {
    const nextTheme = dark ? 'light' : 'dark';
    setTheme(nextTheme);
  }

  const current = tools.find(t => (path === `/tools/${t.slug}` || path.startsWith(`/tools/${t.slug}/`)));

  // Record usage count for stickiness analytics
  useEffect(() => {
    if (current) {
      recordToolUsage(current.slug);
    }
  }, [current]);

  return <div className="app-shell"><CommandPalette/>
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-icon"><Box size={22}/></span>toolbox<span className="brand-dot">.</span></Link>
      <nav aria-label="Tools"><Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`} aria-current={path === '/' ? 'page' : undefined}><Grid2X2 size={18}/>All tools<span className="nav-count">{tools.length}</span></Link>
      {tools.map(t => <Link href={`/tools/${t.slug}`} key={t.slug} className={`nav-link ${current?.slug === t.slug ? 'active' : ''}`} aria-current={current?.slug === t.slug ? 'page' : undefined}><t.icon size={18}/>{t.name}</Link>)}</nav>
      <div className="sidebar-bottom"><p>Toolbox v1.0<br/>Made in Nepal <span aria-label="Nepal">🇳🇵</span></p></div>
    </aside>
    <div className="main-shell"><header className="header"><div className="breadcrumb flex items-center gap-1.5"><span>Workspace</span><span className="slash">/</span><span>{current?.name ?? (path === '/' ? 'All tools' : 'Page not found')}</span>{current && <FavoriteButton slug={current.slug} size={15} className="ml-1" />}</div><div className="header-right">{path !== '/' && <CommandTrigger/>}<button type="button" role="switch" aria-checked={dark} onClick={toggleTheme} className="theme-switch" title={dark ? 'Switch to light theme' : 'Switch to dark theme'} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}><span className={`theme-switch-pill ${dark ? 'is-dark' : 'is-light'}`} aria-hidden="true"/><span className={`theme-switch-btn ${!dark ? 'selected' : ''}`} aria-hidden="true"><Sun size={15}/></span><span className={`theme-switch-btn ${dark ? 'selected' : ''}`} aria-hidden="true"><Moon size={15}/></span></button></div></header>
    <main id="main">
      {/* A route key restarts the entrance animation without remounting the shell. */}
      <div key={path} className="page-transition">{children}</div>
    </main><footer><span>Made for the everyday.</span><span>Simple by design <ArrowUpRight size={13}/></span></footer></div>
  </div>;
}
