'use client';
import { useId } from 'react';
export interface SpeedPoint { seconds:number; value:number }
export default function LiveChart({points,direction}: {points:SpeedPoint[];direction:'download'|'upload'}) {
  const id=useId();
  const max=Math.max(10,Math.ceil(Math.max(0,...points.map(p=>p.value))/50)*50);
  const end=Math.max(10,points.at(-1)?.seconds ?? 0);
  const xy=points.map(p=>`${42+p.seconds/end*290},${155-p.value/max*125}`);
  const last=points.at(-1);
  return <figure className={`live-speed-chart ${direction==='upload'?'is-upload':''}`}>
    <figcaption><strong>Live performance</strong><span>{direction==='download'?'Download':'Upload'}</span></figcaption>
    <svg viewBox="0 0 350 190" role="img" aria-label={`${direction} live estimates${last?`, latest ${last.value.toFixed(1)} Mbps`:', waiting for measurements'}`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--dial-end)" stopOpacity=".3"/><stop offset="1" stopColor="var(--dial-end)" stopOpacity="0"/></linearGradient></defs>
      {[0,.333,.667,1].map(f=><g key={f}><line x1="42" x2="332" y1={155-f*125} y2={155-f*125} stroke="var(--border)"/><text x="32" y={159-f*125} textAnchor="end" fill="var(--text-dim)" fontSize="9">{Math.round(max*f)}</text></g>)}
      {points.length>1 && <><path d={`M${xy[0].split(',')[0]} 155 L${xy.join(' L')} L${xy.at(-1)!.split(',')[0]} 155 Z`} fill={`url(#${id})`}/><polyline points={xy.join(' ')} fill="none" stroke="var(--dial-end)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/></>}
      {last && <circle cx={42+last.seconds/end*290} cy={155-last.value/max*125} r="3.5" fill="var(--panel)" stroke="var(--dial-end)" strokeWidth="2"/>}
      <text x="42" y="177" fill="var(--text-dim)" fontSize="9">0s</text><text x="332" y="177" textAnchor="end" fill="var(--text-dim)" fontSize="9">{end.toFixed(0)}s</text>
      {!last && <text x="187" y="93" textAnchor="middle" fill="var(--text-dim)" fontSize="11">Your connection, in motion</text>}
    </svg>
    <p>{last ? `${last.value.toFixed(1)} Mbps · live estimate` : 'Start a test to see real measurements.'}</p>
  </figure>;
}
