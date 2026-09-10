'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowDown, ArrowUp, Activity, Gauge, Play, RotateCw, Globe2 } from 'lucide-react';
import { storage } from '@/lib/storage';
import { runSpeedTest, type Phase, type Measurement, type Outcome } from './measure';
import type { StageState } from './session';
import SpeedGauge from './speed-gauge';
import { HistoryTrend, ResultInsights } from './result-insights';
type Result = Measurement & { id: string; date: string };
function validHistory(value: unknown): value is Result[] { return Array.isArray(value) && value.every(v => v && typeof v.id === 'string' && typeof v.date === 'string' && Number.isFinite(Date.parse(v.date)) && ['ping','download','upload'].every(k => typeof v[k] === 'number' && Number.isFinite(v[k]) && v[k] >= 0)); }
const stats = [{ key:'ping', label:'Ping', unit:'ms', icon:Activity }, { key:'download', label:'Download', unit:'Mbps', icon:ArrowDown }, { key:'upload', label:'Upload', unit:'Mbps', icon:ArrowUp }] as const;
export default function SpeedTest() {
  const [phase, setPhase] = useState<Phase | 'idle' | 'done' | 'partial' | 'cancelled'>('idle');
  const [stageState, setStageState] = useState<StageState | 'warming'>('running');
  const [retryPhase, setRetryPhase] = useState<Phase | null>(null);
  const [gaugeDirection, setGaugeDirection] = useState<'download' | 'upload'>('download');
  const [values, setValues] = useState<Partial<Measurement>>({});
  const [details, setDetails] = useState<Outcome | null>(null);
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
    setError(''); setDetails(null); setValues({}); setSpeed(0); setPhase('ping');
    try {
      const result = await runSpeedTest(run.signal, p => { if (mounted.current) { setPhase(p); setSpeed(0); setRetryPhase(null); if (p !== 'ping') setGaugeDirection(p); } }, value => { if (mounted.current) { setSpeed(value); setStageState('running'); } }, (key, value) => { if (mounted.current) setValues(previous => ({ ...previous, [key]: value })); }, (key,state) => { if (mounted.current) { setStageState(state); if (state === 'retrying') setRetryPhase(key); } });
      if (!mounted.current || run.signal.aborted) return;
      setDetails(result); setSpeed(result.download ?? result.upload ?? 0);
      setGaugeDirection(result.download !== undefined ? 'download' : 'upload');
      if (result.ping === undefined || result.download === undefined || result.upload === undefined) {
        setPhase('partial');
        setError(Object.entries(result.errors).map(([key,message]) => `${key}: ${message} Retried once.`).join(' '));
        return;
      }
      setPhase('done');
      const next: Result[] = [{ ...result, ping:result.ping, download:result.download, upload:result.upload, id: crypto.randomUUID(), date: new Date().toISOString() }, ...history].slice(0,5);
      setHistory(next);
      try { await storage.set('speed-test', 'history', next); } catch { if (mounted.current) setStorageNote('Test complete. This browser could not save the result locally.'); }
    } catch (reason) {
      if (!mounted.current) return;
      if (run.signal.aborted) { setPhase('cancelled'); setError('Test stopped. Completed values are kept below; this partial run is not added to history.'); }
      else { setPhase('idle'); setError(reason instanceof TypeError ? 'Couldn’t reach Cloudflare. Check your connection, firewall, or ad blocker, then try again.' : reason instanceof Error ? reason.message : 'The test could not complete. Please try again.'); }
    } finally { if (controller.current === run) controller.current = null; }
  }
  const label = phase === 'idle' ? 'Ready when you are' : phase === 'done' ? 'Test complete' : phase === 'partial' ? 'Partial results — test did not fully complete' : phase === 'cancelled' ? 'Test stopped — partial results kept' : stageState === 'paused' ? 'Test paused — tab hidden' : stageState === 'retrying' ? `Retrying ${phase} — attempt 2 of 2` : stageState === 'warming' ? `Warming up ${phase}…` : `Measuring ${phase}…`;
  return <div className="page"><Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link><div className="tool-heading"><span className="tool-icon"><Gauge size={28}/></span><div><h1>Speed test</h1><p>A fuller picture of speed and responsiveness.</p></div></div>
    <div className="speed-layout"><div><section className="test-panel" aria-label="Connection speed test"><div className="panel-top"><span><span className="status-dot"/>{running ? 'Test in progress' : 'Connection test'}</span><span><Globe2 size={13}/>Cloudflare</span></div>
    <SpeedGauge value={speed} direction={gaugeDirection} caption={running ? stageState === 'paused' ? 'Paused · last live estimate' : 'Live estimate · final result uses completed rounds' : phase === 'idle' ? 'Ready to measure' : phase === 'cancelled' ? 'Last live estimate · incomplete' : phase === 'partial' ? 'Completed phase · partial test' : 'Measured throughput'}/>
    <div className="phase" role="status" aria-live="polite">{label}</div>
    {running && retryPhase && <p className="test-note">Retrying {retryPhase} once after a connection error (attempt 2 of 2).</p>}
    {running && stageState === 'paused' && <p className="test-note">Completed phases are kept. When you return, the interrupted phase will warm up and restart automatically.</p>}
    <div className="stats">{stats.map(s => <div className="stat" key={s.key}><div className="stat-label"><s.icon size={13}/>{s.label}</div><strong>{values[s.key]?.toFixed(1) ?? (details?.errors[s.key] ? 'Failed' : phase === 'cancelled' ? 'Not completed' : running && phase === s.key ? 'Testing' : 'Pending')}</strong><small>{values[s.key] !== undefined ? s.unit : 'No final value yet'}</small></div>)}</div>
    {details && <div className="my-5 rounded-panel border border-border bg-bg p-4 text-left">
      <h2 className="mb-3 text-sm font-semibold text-text">Connection quality</h2>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-dim">Jitter</dt><dd className="mt-1 font-medium text-text">{details.jitter?.toFixed(1) ?? 'Unavailable'}{details.jitter !== undefined ? ' ms' : ''}</dd></div>
        <div><dt className="text-dim">Measurement</dt><dd className="mt-1 font-medium text-text">4 streams · median of 3 rounds</dd></div>
        <div><dt className="text-dim">Mean HTTP ping</dt><dd className="mt-1 font-medium text-text">{details.pingMean?.toFixed(1) ?? 'Unavailable'} ms</dd></div>
        <div><dt className="text-dim">Ping timing</dt><dd className="mt-1 font-medium text-text">{details.timing === 'resource' ? 'Request to first response byte' : 'Warmed HTTP fallback'}</dd></div>
        <div><dt className="text-dim">Latency during download</dt><dd className="mt-1 font-medium text-text">{details.downloadLatency?.toFixed(1) ?? 'Unavailable'}{details.downloadLatency !== undefined ? ' ms' : ''}</dd></div>
        <div><dt className="text-dim">Latency during upload</dt><dd className="mt-1 font-medium text-text">{details.uploadLatency?.toFixed(1) ?? 'Unavailable'}{details.uploadLatency !== undefined ? ' ms' : ''}</dd></div>
        <div><dt className="text-dim">Download range</dt><dd className="mt-1 font-medium text-text">{details.downloadRange ? `${details.downloadRange.min.toFixed(1)}–${details.downloadRange.max.toFixed(1)} Mbps` : 'Unavailable'}</dd></div>
        <div><dt className="text-dim">Upload range</dt><dd className="mt-1 font-medium text-text">{details.uploadRange ? `${details.uploadRange.min.toFixed(1)}–${details.uploadRange.max.toFixed(1)} Mbps` : 'Unavailable'}</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-dim">Ranges show variation between rounds, not a guaranteed accuracy interval. Higher latency during transfers can make calls or browsing feel slower.</p>
    </div>}
    <button className="primary-button" disabled={running} onClick={start}>{running ? <Activity size={16}/> : phase === 'done' ? <RotateCw size={16}/> : <Play size={15}/>} {running ? 'Testing your connection…' : phase === 'done' ? 'Test again' : 'Start test'}</button>{running && <button className="cancel-button" onClick={() => controller.current?.abort()}>Cancel test</button>}
    <p className="test-note">Usually takes 30–60 seconds; slow connections may take longer.<br/>Uses real traffic—hundreds of MB or more on fast connections. Hiding this tab pauses the test; returning resumes it.</p>{error && <p className="error" role="alert">{error}</p>}<p className="mt-4 text-xs leading-relaxed text-dim">An 80 Mbps plan can sometimes measure above 80; we do not cap results to a plan. For a fair comparison, use Ethernet or strong Wi-Fi, stop other downloads, and repeat on the same device. No browser test can guarantee an exact speed.</p></section>
    {details && <ResultInsights result={details}/>}
    <section className="history"><div className="history-heading"><h2>Recent results</h2><span>On this device</span></div><HistoryTrend results={history}/>{history.length ? <ul className="history-list">{history.map(r => <li key={r.id}><time dateTime={r.date}>{new Date(r.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time><span>↓ {r.download.toFixed(0)} Mbps · ↑ {r.upload.toFixed(0)} Mbps · {r.ping.toFixed(0)} ms{r.method !== 'parallel-v3' ? ' · Earlier method' : ''}</span></li>)}</ul> : <p className="history-empty">Your completed tests will appear here.</p>}{storageNote && <p className="test-note" role="status">{storageNote}</p>}</section></div>
    <aside className="info-panel"><h2>Behind the numbers</h2><div className="info-item"><h3><ArrowDown size={15}/>Download</h3><p>How quickly data reaches your device. Higher speeds help with streaming and large files.</p></div><div className="info-item"><h3><ArrowUp size={15}/>Upload</h3><p>How quickly you send data. Useful for video calls, sharing files, and cloud backups.</p></div><div className="info-item"><h3><Activity size={15}/>Ping</h3><p>Median of ten warmed HTTP probes. Resource Timing excludes connection setup when available; server processing still contributes. This is not ICMP ping.</p></div><p className="server-note">Measured through Cloudflare’s public endpoints using four concurrent streams, a two-second warm-up and three four-second rounds per direction. The final speed is the median, not the peak. This is browser HTTP throughput to one provider, not a guaranteed ISP line rate.</p></aside></div>
  </div>;
}
