'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowDown, ArrowUp, Activity, Gauge, Play, RotateCw, Globe2 } from 'lucide-react';
import { storage } from '@/lib/storage';
import { runSpeedTest, type Phase, type Measurement } from './measure';
type Result = Measurement & { id: string; date: string };
function validHistory(value: unknown): value is Result[] { return Array.isArray(value) && value.every(v => v && typeof v.id === 'string' && typeof v.date === 'string' && Number.isFinite(Date.parse(v.date)) && ['ping','download','upload'].every(k => typeof v[k] === 'number' && Number.isFinite(v[k]) && v[k] >= 0)); }
const stats = [{ key:'ping', label:'Ping', unit:'ms', icon:Activity }, { key:'download', label:'Download', unit:'Mbps', icon:ArrowDown }, { key:'upload', label:'Upload', unit:'Mbps', icon:ArrowUp }] as const;
export default function SpeedTest() {
  const [phase, setPhase] = useState<Phase | 'idle' | 'done' | 'cancelled'>('idle');
  const [values, setValues] = useState<Partial<Measurement>>({});
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Result[]>([]);
  const [storageNote, setStorageNote] = useState('');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const running = phase === 'ping' || phase === 'download' || phase === 'upload';
  useEffect(() => { mounted.current = true; storage.get<unknown>('speed-test', 'history').then(saved => { if (mounted.current && validHistory(saved)) setHistory(saved.slice(0,5)); }).catch(() => { if (mounted.current) setStorageNote('Local history is unavailable in this browser.'); }); return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  async function start() {
    if (controller.current) return;
    const run = new AbortController(); controller.current = run;
    setError(''); setValues({}); setSpeed(0); setPhase('ping');
    try {
      const result = await runSpeedTest(run.signal, p => { if (mounted.current) { setPhase(p); setSpeed(0); } }, value => { if (mounted.current) setSpeed(value); }, (key, value) => { if (mounted.current) setValues(previous => ({ ...previous, [key]: value })); });
      if (!mounted.current || run.signal.aborted) return;
      setPhase('done'); setSpeed(result.download);
      const next = [{ ...result, id: crypto.randomUUID(), date: new Date().toISOString() }, ...history].slice(0,5);
      setHistory(next);
      try { await storage.set('speed-test', 'history', next); } catch { if (mounted.current) setStorageNote('Test complete. This browser could not save the result locally.'); }
    } catch (reason) {
      if (!mounted.current) return;
      if (run.signal.aborted) { setPhase('cancelled'); }
      else { setPhase('idle'); setError(reason instanceof TypeError ? 'Couldn’t reach Cloudflare. Check your connection, firewall, or ad blocker, then try again.' : reason instanceof Error ? reason.message : 'The test could not complete. Please try again.'); }
    } finally { if (controller.current === run) controller.current = null; }
  }
  const label = phase === 'idle' ? 'Ready when you are' : phase === 'done' ? 'Test complete' : phase === 'cancelled' ? 'Test cancelled' : `Measuring ${phase}…`;
  return <div className="page"><Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link><div className="tool-heading"><span className="tool-icon"><Gauge size={28}/></span><div><h1>Speed test</h1><p>A quick check-in with your connection.</p></div></div>
    <div className="speed-layout"><div><section className="test-panel" aria-label="Connection speed test"><div className="panel-top"><span><span className="status-dot"/>{running ? 'Test in progress' : 'Connection test'}</span><span><Globe2 size={13}/>Cloudflare</span></div>
    <div className="gauge"><svg viewBox="0 0 280 172" aria-hidden="true"><path d="M25 145 A115 115 0 0 1 255 145" fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round"/><path d="M25 145 A115 115 0 0 1 255 145" fill="none" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - Math.min(speed/300,1)*100} style={{ transition:'stroke-dashoffset 150ms linear' }}/><text x="20" y="171" fill="var(--text-dim)" fontSize="10">0</text><text x="237" y="171" fill="var(--text-dim)" fontSize="10">300+</text></svg><div className="readout"><strong>{speed.toFixed(0)}</strong><span>Mbps {phase === 'upload' ? 'upload' : 'download'}</span></div></div>
    <div className="phase" role="status" aria-live="polite">{label}</div><div className="stats">{stats.map(s => <div className="stat" key={s.key}><div className="stat-label"><s.icon size={13}/>{s.label}</div><strong>{values[s.key]?.toFixed(0) ?? '—'}</strong><small>{s.unit}</small></div>)}</div>
    <button className="primary-button" disabled={running} onClick={start}>{running ? <Activity size={16}/> : phase === 'done' ? <RotateCw size={16}/> : <Play size={15}/>} {running ? 'Testing your connection…' : phase === 'done' ? 'Test again' : 'Start test'}</button>{running && <button className="cancel-button" onClick={() => controller.current?.abort()}>Cancel test</button>}
    <p className="test-note">Usually takes 15–30 seconds. Uses real download and upload data.<br/>Data usage varies with your connection speed.</p>{error && <p className="error" role="alert">{error}</p>}</section>
    <section className="history"><div className="history-heading"><h2>Recent results</h2><span>On this device</span></div>{history.length ? <ul className="history-list">{history.map(r => <li key={r.id}><time dateTime={r.date}>{new Date(r.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time><span>↓ {r.download.toFixed(0)} Mbps · ↑ {r.upload.toFixed(0)} Mbps · {r.ping.toFixed(0)} ms</span></li>)}</ul> : <p className="history-empty">Your completed tests will appear here.</p>}{storageNote && <p className="test-note" role="status">{storageNote}</p>}</section></div>
    <aside className="info-panel"><h2>Behind the numbers</h2><div className="info-item"><h3><ArrowDown size={15}/>Download</h3><p>How quickly data reaches your device. Higher speeds help with streaming and large files.</p></div><div className="info-item"><h3><ArrowUp size={15}/>Upload</h3><p>How quickly you send data. Useful for video calls, sharing files, and cloud backups.</p></div><div className="info-item"><h3><Activity size={15}/>Ping</h3><p>The time a request takes to reach the server and return. A lower number means a snappier connection.</p></div><p className="server-note">Measured through Cloudflare’s public speed test endpoints. Results reflect this browser’s connection and may vary between tests.</p></aside></div>
  </div>;
}
