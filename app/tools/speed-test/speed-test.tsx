'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowDown, ArrowUp, Activity, Gauge, Play, RotateCw, Globe2, Server, Waves } from 'lucide-react';
import { storage } from '@/lib/storage';
import { runSpeedTest, type Phase, type Measurement, type Outcome, type TestMode } from './measure';
import type { StageState } from './session';
import SpeedGauge from './speed-gauge';
import LiveChart, { type SpeedPoint } from './live-chart';
import { getConnectionLocation, type ConnectionLocation } from './location';
import { HistoryTrend, ResultInsights } from './result-insights';

type Result = Measurement & { id:string; date:string };
function validHistory(value:unknown): value is Result[] { return Array.isArray(value) && value.every(v=>v && typeof v.id==='string' && typeof v.date==='string' && Number.isFinite(Date.parse(v.date)) && ['ping','download','upload'].every(k=>typeof v[k]==='number' && Number.isFinite(v[k]) && v[k]>=0)); }
const stats=[{key:'ping',label:'Ping',unit:'ms',icon:Activity},{key:'download',label:'Download',unit:'Mbps',icon:ArrowDown},{key:'upload',label:'Upload',unit:'Mbps',icon:ArrowUp},{key:'jitter',label:'Jitter',unit:'ms',icon:Waves}] as const;
export default function SpeedTest() {
  const [phase,setPhase]=useState<Phase|'idle'|'done'|'partial'|'cancelled'>('idle');
  const [stageState,setStageState]=useState<StageState|'warming'>('running');
  const [mode,setMode]=useState<TestMode>('quick');
  const [runMode,setRunMode]=useState<TestMode>('quick');
  const [direction,setDirection]=useState<'download'|'upload'>('download');
  const [values,setValues]=useState<Partial<Measurement>>({});
  const [details,setDetails]=useState<Outcome|null>(null);
  const [speed,setSpeed]=useState(0);
  const [progress,setProgress]=useState(0);
  const [series,setSeries]=useState<Record<'download'|'upload',SpeedPoint[]>>({download:[],upload:[]});
  const [location,setLocation]=useState<ConnectionLocation|null>(null);
  const [locationState,setLocationState]=useState('Available after starting');
  const [error,setError]=useState('');
  const [history,setHistory]=useState<Result[]>([]);
  const [storageNote,setStorageNote]=useState('');
  const controller=useRef<AbortController|null>(null);
  const mounted=useRef(false);
  const running=phase==='ping'||phase==='download'||phase==='upload';
  useEffect(()=>{mounted.current=true;storage.get<unknown>('speed-test','history').then(saved=>{if(mounted.current&&validHistory(saved))setHistory(saved.slice(0,5));}).catch(()=>{if(mounted.current)setStorageNote('Local history is unavailable in this browser.');});return()=>{mounted.current=false;controller.current?.abort();};},[]);
  async function start() {
    if(controller.current)return;
    const run=new AbortController();controller.current=run;
    let active:Phase='ping';let stageStart=performance.now();
    const samples:Record<'download'|'upload',SpeedPoint[]>={download:[],upload:[]};
    setRunMode(mode);setError('');setDetails(null);setValues({});setSpeed(0);setProgress(0);setPhase('ping');setStageState('running');setDirection('download');setSeries({download:[],upload:[]});setLocation(null);setLocationState('Finding route…');
    // A failed location lookup must never block the actual test.
    void getConnectionLocation(run.signal).then(info=>{if(mounted.current&&controller.current===run&&!run.signal.aborted)setLocation(info);}).catch(()=>{if(mounted.current&&controller.current===run&&!run.signal.aborted)setLocationState('Unavailable');});
    try {
      const result=await runSpeedTest(run.signal,p=>{active=p;stageStart=performance.now();if(mounted.current){setPhase(p);setSpeed(0);if(p!=='ping')setDirection(p);}},value=>{
        if(!mounted.current||run.signal.aborted)return;
        setSpeed(value);setStageState('running');
        if(active!=='ping') { const key=active; samples[key].push({seconds:(performance.now()-stageStart)/1000,value}); if(samples[key].length>600)samples[key].shift();setSeries(previous=>({...previous,[key]:[...samples[key]]})); }
      },(_key,_value,metrics)=>{if(mounted.current)setValues({...metrics});},(key,state)=>{
        if(!mounted.current)return;setStageState(state);
        if(state==='warming'&&key!=='ping'){stageStart=performance.now();samples[key]=[];setSeries(previous=>({...previous,[key]:[]}));setSpeed(0);}
      },undefined,mode,value=>{if(mounted.current)setProgress(Math.min(99,value));});
      if(!mounted.current||run.signal.aborted)return;
      setDetails(result);setSpeed(result.download??result.upload??0);setDirection(result.download!==undefined?'download':'upload');
      if(result.ping===undefined||result.download===undefined||result.upload===undefined){setPhase('partial');setError(Object.entries(result.errors).map(([key,message])=>`${key}: ${message} Retried once.`).join(' '));return;}
      setPhase('done');setProgress(100);
      const next:Result[]=[{...result,ping:result.ping,download:result.download,upload:result.upload,id:crypto.randomUUID(),date:new Date().toISOString()},...history].slice(0,5);setHistory(next);
      try{await storage.set('speed-test','history',next);}catch{if(mounted.current)setStorageNote('Test complete. This browser could not save the result locally.');}
    }catch(reason){
      if(!mounted.current)return;
      if(run.signal.aborted){setPhase('cancelled');setError('Test stopped. Completed values are kept; this partial run is not saved to history.');}
      else{setPhase('partial');setError(reason instanceof Error?reason.message:'Could not reach Cloudflare. Please try again.');}
    }finally{if(controller.current===run)controller.current=null;}
  }
  const label=phase==='idle'?'Ready when you are':phase==='done'?'Test complete':phase==='partial'?'Partial results':phase==='cancelled'?'Test stopped':stageState==='paused'?'Paused — return to this tab to resume':stageState==='retrying'?`Retrying ${phase}…`:stageState==='warming'?`Warming up ${phase}…`:`Measuring ${phase}…`;
  const caption=phase==='idle'?'Ready to measure':running?(phase==='ping'?'Checking response time':stageState==='paused'?'Paused':`${stageState==='warming'?'Warming up':'Testing'} ${direction}`):phase==='done'?`${direction==='download'?'Download':'Upload'} result`:'Partial measurement';
  return <div className="page speed-page"><Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link><div className="tool-heading"><span className="tool-icon"><Gauge size={28}/></span><div><h1>Speed test</h1><p>Your connection. A clearer picture.</p></div></div>
    <div className="speed-layout"><div><section className="test-panel speed-studio" aria-label="Connection speed test">
      <div className="studio-top"><div className="studio-status"><span className={`connection-dot ${running&&stageState!=='paused'?'is-running':''}`}/><div><strong>{running?'Test in progress':phase==='done'?'Your results are ready':'Let’s check your connection'}</strong><p role="status">{label}</p></div></div><span className="provider"><Globe2 size={14}/>Test network: Cloudflare</span></div>
      <div className="speed-mode" role="group" aria-label="Test duration"><button disabled={running} aria-pressed={mode==='quick'} onClick={()=>setMode('quick')}>Quick <span>~15–25s</span></button><button disabled={running} aria-pressed={mode==='thorough'} onClick={()=>setMode('thorough')}>Thorough <span>~30–60s</span></button></div>
      <div className="speed-visuals"><SpeedGauge value={speed} direction={direction} caption={caption}/><div className="performance-panel">
        {!running&&phase!=='idle'&&<div className="chart-switch" role="group" aria-label="View measured direction">{(['download','upload'] as const).map(key=><button key={key} aria-pressed={direction===key} onClick={()=>{setDirection(key);setSpeed(values[key]??0);}}>{key==='download'?'Download':'Upload'}</button>)}</div>}
        <LiveChart points={series[direction]} direction={direction}/><div className="connection-locations"><div><Globe2 size={18}/><p><span>Testing from</span><strong>{location?.country??locationState}</strong></p></div><div><Server size={18}/><p><span>Routed server</span><strong>{location?.server??locationState}</strong></p></div></div><p className="location-hint">Approximate network location · route reported at test start.</p>
      </div></div>
      <div className="speed-metrics">{stats.map(s=>{const final=values[s.key];const live=running&&phase===s.key&&stageState==='running'&&speed>0;return <div className={`metric-tile metric-${s.key} ${running&&phase===s.key?'metric-active':''}`} key={s.key}><div className="metric-label"><s.icon size={17}/>{s.label}</div><strong>{final!==undefined?final.toFixed(1):live?speed.toFixed(1):s.key!=='jitter'&&details?.errors[s.key]?'Failed':running&&phase===s.key?'Testing…':'—'}</strong><small>{s.unit}{live?' · live':''}</small></div>;})}</div>
      <div className="test-controls"><div><span>{label}</span><div className="test-progress" role="progressbar" aria-label="Completed measurement stages" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{width:`${progress}%`}}/></div><small>{running?`${runMode==='quick'?'Quick':'Thorough'} test · progress advances as rounds finish`:'Choose a mode and see how your network performs.'}</small></div>{running?<button className="stop-test" onClick={()=>controller.current?.abort()}>Cancel test</button>:<button className="primary-button" onClick={start}>{phase==='idle'?<Play size={16}/>:<RotateCw size={16}/>} {phase==='idle'?'Start test':'Test again'}</button>}</div>
      <p className="test-note">Quick uses shorter samples; Thorough checks sustained speed for longer. Slow connections and retries can take longer. Real transfers may use hundreds of MB or more. Hiding this tab pauses the test.</p>
      {running&&stageState==='paused'&&<p className="test-note">Completed phases are kept. The interrupted phase restarts when you return.</p>}
      {error&&<p className="error" role="alert">{error}</p>}
      {details&&<details className="measurement-details"><summary>Measurement details</summary><dl><div><dt>Method</dt><dd>4 streams · median of 3 rounds · {runMode}</dd></div><div><dt>Mean HTTP ping</dt><dd>{details.pingMean?.toFixed(1)??'Unavailable'} ms</dd></div><div><dt>Ping timing</dt><dd>{details.timing==='resource'?'Request to first byte':'Warmed HTTP fallback'}</dd></div>{(['download','upload'] as const).map(key=><div key={key}><dt>{key==='download'?'Download':'Upload'} range / loaded latency</dt><dd>{details[`${key}Range`]?`${details[`${key}Range`]!.min.toFixed(1)}–${details[`${key}Range`]!.max.toFixed(1)} Mbps`:'Unavailable'} · {details[`${key}Latency`]?.toFixed(1)??'Unavailable'} ms</dd></div>)}</dl><p>Ranges show variation, not an accuracy guarantee. Upload live readings are provisional until the server acknowledges the data. Results are never capped to your plan.</p></details>}
    </section>{details&&<ResultInsights result={details}/>}
    <section className="history"><div className="history-heading"><h2>Recent results</h2><span>On this device</span></div><HistoryTrend results={history}/>{history.length?<ul className="history-list">{history.map(r=><li key={r.id}><time dateTime={r.date}>{new Date(r.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time><span>↓ {r.download.toFixed(0)} Mbps · ↑ {r.upload.toFixed(0)} Mbps · {r.ping.toFixed(0)} ms · {r.method==='parallel-quick-v4'?'Quick':r.method==='parallel-v3'?'Thorough':'Earlier method'}</span></li>)}</ul>:<p className="history-empty">Your completed tests will appear here.</p>}{storageNote&&<p className="test-note" role="status">{storageNote}</p>}</section></div>
    <aside className="info-panel"><h2>Behind the numbers</h2><div className="info-item"><h3><ArrowDown size={20}/>Download</h3><p>How quickly data reaches your device. Higher speeds help with streaming and large files.</p></div><div className="info-item"><h3><ArrowUp size={20}/>Upload</h3><p>How quickly you send data. Useful for video calls, sharing files, and cloud backups.</p></div><div className="info-item"><h3><Activity size={20}/>Ping & jitter</h3><p>Ping measures response time. Jitter shows how much it varies. Lower, steadier values help calls and games feel responsive.</p></div><p className="server-note">Four concurrent streams, three measured rounds per direction. Quick uses a 1s warm-up, 2s rounds and 6 warmed HTTP probes. Thorough uses 2s, 4s and 10 probes. These are browser HTTP measurements, not game-server ping or a guaranteed ISP line rate.</p></aside></div>
  </div>;
}
