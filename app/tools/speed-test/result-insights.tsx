import { Globe2, Gamepad2, Video, MonitorPlay } from 'lucide-react';
import type { Measurement } from './measure';

// These are transparent rules of thumb, not service guarantees or packet-loss tests.
export function activityRatings(result: Partial<Measurement>) {
  const {download,upload,ping,jitter} = result;
  return [
    {name:'Browsing',icon:Globe2,good:download === undefined ? undefined : download >= 5,rule:'5+ Mbps download'},
    {name:'HD streaming',icon:MonitorPlay,good:download === undefined ? undefined : download >= 10,rule:'10+ Mbps download'},
    {name:'Video calls',icon:Video,good:download === undefined || upload === undefined || ping === undefined ? undefined : download >= 5 && upload >= 3 && ping < 150,rule:'5↓ / 3↑ Mbps, ping under 150 ms'},
    {name:'Gaming',icon:Gamepad2,good:download === undefined || upload === undefined || ping === undefined || jitter === undefined ? undefined : download >= 5 && upload >= 1 && ping < 80 && jitter < 20,rule:'5↓ / 1↑ Mbps, ping <80 ms, jitter <20 ms'},
  ];
}

export function ResultInsights({result}: {result:Partial<Measurement>}) {
  return <section className="mt-5 rounded-panel border border-border bg-panel p-5">
    <h2 className="text-sm font-semibold">What could this connection handle?</h2>
    <div className="mt-4 grid grid-cols-2 gap-3">{activityRatings(result).map(item => <div key={item.name} className="rounded-panel border border-border bg-bg p-3">
      <div className="flex items-center gap-2 text-sm font-medium"><item.icon size={16}/>{item.name}</div>
      <p className="mt-2 text-xs text-accent">{item.good === undefined ? 'Not enough data' : item.good ? 'Looks suitable' : 'May struggle'}</p>
      <p className="mt-1 text-xs text-dim">{item.rule}</p>
    </div>)}</div>
    <p className="mt-3 text-xs leading-relaxed text-dim">Estimates for one device, based on this test. Wi-Fi, other users, packet loss and the app’s own servers also matter. HTTP ping is not game-server ping.</p>
  </section>;
}

// Keep the chart chronological even though the history list is newest-first.
export function HistoryTrend({results}: {results:(Measurement & {date:string})[]}) {
  if (results.length < 3) return null;
  const ordered = [...results].sort((a,b) => Date.parse(a.date)-Date.parse(b.date));
  const maximum = Math.max(1,...ordered.flatMap(result => [result.download,result.upload]));
  const points = (key:'download'|'upload') => ordered.map((result,index) => `${8 + index/(ordered.length-1)*284},${68-result[key]/maximum*56}`).join(' ');
  return <figure className="mb-4 rounded-panel border border-border bg-bg p-3">
    <figcaption className="mb-2 flex flex-wrap gap-3 text-xs text-dim"><span className="text-accent">Download —</span><span>Upload ⋯</span><span>Oldest → newest · Mbps</span></figcaption>
    <svg viewBox="0 0 300 80" className="h-20 w-full" role="img" aria-label={`Recent test trend. Download: ${ordered.map(result => result.download.toFixed(1)).join(', ')} Mbps. Upload: ${ordered.map(result => result.upload.toFixed(1)).join(', ')} Mbps.`}>
      <path d="M8 68H292" stroke="var(--border)"/>
      <polyline points={points('download')} fill="none" stroke="var(--accent)" strokeWidth="2"/>
      <polyline points={points('upload')} fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeDasharray="4 3"/>
    </svg>
    {ordered.some(result => result.method !== 'parallel-v3') && <p className="text-xs text-dim">Includes earlier measurement methods; compare with care.</p>}
  </figure>;
}
