import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Plus, Zap, ShieldCheck, MousePointer2 } from 'lucide-react';
import { tools } from '@/lib/tools-registry';
export default function Home() { return <div className="page home-page">
  <div className="eyebrow"><span className="status-dot"/> YOUR EVERYDAY TOOLKIT</div>
  <h1>Less friction.<br/><span>More getting things done.</span></h1>
  <p className="intro">Handy tools for the little things that fill your day.<br className="desktop-break"/> All in one place, ready when you are.</p>
  <div className="section-heading"><h2>All tools <span className="badge">{tools.length}</span></h2><span>A growing collection of useful things</span></div>
  <div className="tool-grid">{tools.map(t => <Link key={t.slug} href={`/tools/${t.slug}`} className="tool-card"><div className="card-top"><span className="tool-icon"><t.icon size={27} strokeWidth={1.7}/></span><ArrowUpRight size={21} className="card-arrow"/></div><span className="category">{t.category}</span><h3>{t.name}</h3><p>{t.description}</p><div className="card-bottom"><span>Open tool <ArrowRight size={15}/></span><span className="availability"><span className="status-dot"/>Ready to use</span></div></Link>)}
  <div className="coming-card"><span className="coming-icon"><Plus size={25} strokeWidth={1.4}/></span><h3>A little room for more.</h3><p>More everyday tools will find<br/>their home here.</p><span className="coming-label">THE TOOLKIT IS GROWING</span></div></div>
  <div className="principles"><div><Zap size={18}/><span>Open it. Use it. Done.</span></div><div><ShieldCheck size={18}/><span>No account needed</span></div><div><MousePointer2 size={18}/><span>One space, less searching</span></div></div></div>; }

