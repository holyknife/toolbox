import ToolGrid from '@/components/tool-grid';
import { Zap, ShieldCheck, MousePointer2 } from 'lucide-react';

export default function Home() { return <div className="page home-page">
  <div className="eyebrow"><span className="status-dot"/> YOUR EVERYDAY TOOLKIT</div>
  <h1>Less friction.<br/><span>More getting things done.</span></h1>
  <p className="intro">Handy tools for the little things that fill your day.<br className="desktop-break"/> All in one place, ready when you are.</p>
  <ToolGrid/>
  <div className="principles"><div><Zap size={18}/><span>Open it. Use it. Done.</span></div><div><ShieldCheck size={18}/><span>No account needed</span></div><div><MousePointer2 size={18}/><span>One space, less searching</span></div></div></div>; }

