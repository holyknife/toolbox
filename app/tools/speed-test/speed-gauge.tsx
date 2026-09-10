'use client';
import { useEffect, useId, useRef, useState } from 'react';

// Ease between real progress samples; never invent throughput during warm-up.
function useSmoothValue(value: number) {
  const current = useRef(value);
  const [shown,setShown] = useState(value);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const from = current.current;
    let frame = 0;
    const started = performance.now();
    const finish = () => { cancelAnimationFrame(frame); current.current = value; setShown(value); };
    const tick = (now: number) => {
      const progress = Math.min((now-started)/180,1);
      current.current = from + (value-from)*(1-Math.pow(1-progress,3));
      setShown(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    const changed = () => { if (preference.matches) finish(); };
    if (preference.matches) finish(); else frame = requestAnimationFrame(tick);
    preference.addEventListener('change',changed);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener('change',changed); };
  },[value]);
  return shown;
}

// Arc and needle share a 0–300 display scale; the numeric reading remains uncapped.
export default function SpeedGauge({value,direction,caption}: {value:number;direction:string;caption:string}) {
  const shown = useSmoothValue(value);
  const gradient = useId();
  return <div className="speed-gauge">
    <svg viewBox="0 0 280 175" aria-hidden="true">
      <defs><linearGradient id={gradient} x1="0" x2="1"><stop offset="0%" stopColor="var(--speed-low)"/><stop offset="33%" stopColor="var(--speed-medium)"/><stop offset="66%" stopColor="var(--speed-good)"/><stop offset="100%" stopColor="var(--speed-fast)"/></linearGradient></defs>
      <path d="M25 145 A115 115 0 0 1 255 145" fill="none" stroke="var(--border)" strokeWidth="13" strokeLinecap="round"/>
      <path d="M25 145 A115 115 0 0 1 255 145" fill="none" stroke={`url(#${gradient})`} strokeWidth="9" strokeLinecap="round"/>
      <line x1="140" y1="145" x2="40" y2="145" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${Math.min(shown/300,1)*180} 140 145)`}/>
      <circle cx="140" cy="145" r="6" fill="var(--text)"/>
      <text x="17" y="171" fill="var(--text-dim)" fontSize="11">0</text><text x="232" y="171" fill="var(--text-dim)" fontSize="11">300+</text>
    </svg>
    <div className="speed-number"><strong>{shown.toFixed(1)}</strong><span>Mbps {direction}</span><small>{caption}</small></div>
  </div>;
}
