'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Boxes, Grid2X2, Moon, Sun, PanelLeftClose } from 'lucide-react';
import { tools } from '@/lib/tools-registry';
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  const current = tools.find(t => (path === `/tools/${t.slug}` || path.startsWith(`/tools/${t.slug}/`)));
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-icon"><Boxes size={23}/></span>toolbox<span className="brand-dot">.</span></Link>
      <div className="workspace-label">YOUR WORKSPACE <PanelLeftClose size={14}/></div>
      <nav aria-label="Tools"><Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`} aria-current={path === '/' ? 'page' : undefined}><Grid2X2 size={18}/>All tools<span className="nav-count">{tools.length}</span></Link>
      <div className="nav-label">TOOLS</div>{tools.map(t => <Link href={`/tools/${t.slug}`} key={t.slug} className={`nav-link ${current?.slug === t.slug ? 'active' : ''}`} aria-current={current?.slug === t.slug ? 'page' : undefined}><t.icon size={18}/>{t.name}</Link>)}</nav>
      <div className="sidebar-bottom"><span className="small-mark"><Boxes size={17}/></span><p>A little less effort.<br/><strong>A lot more done.</strong></p><span className="version">Toolbox / v1.0</span></div>
    </aside>
    <div className="main-shell"><header className="header"><div className="breadcrumb"><span>Workspace</span><span className="slash">/</span><span>{current?.name ?? (path === '/' ? 'All tools' : 'Page not found')}</span></div><div className="header-right"><span className="header-note">Small tools. Everyday useful.</span><button className="icon-button" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`} title={`Switch to ${dark ? 'light' : 'dark'} theme`}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button></div></header>
    <main id="main">
      {/* A route key restarts the entrance animation without remounting the shell. */}
      <div key={path} className="page-transition">{children}</div>
    </main><footer><span>Made for the everyday.</span><span>Simple by design <ArrowUpRight size={13}/></span></footer></div>
  </div>;
}
