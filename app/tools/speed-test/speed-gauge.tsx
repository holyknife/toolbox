'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Activity, Play, RotateCw } from 'lucide-react';

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
      const progress = Math.min((now-started)/320,1);
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
function point(fraction:number,radius:number) {
  const angle = (135 + fraction*270)*Math.PI/180;
  // Round SVG coordinates to avoid platform-specific trig precision during hydration.
  return {x:Number((160+Math.cos(angle)*radius).toFixed(3)),y:Number((160+Math.sin(angle)*radius).toFixed(3))};
}
const arc = 'M 75.15 244.85 A 120 120 0 1 1 244.85 244.85';

export interface SpeedGaugeProps {
  value: number;
  direction: string;
  caption: string;
  phase?: 'idle' | 'ping' | 'download' | 'upload' | 'done' | 'partial' | 'cancelled';
  onStart?: () => void;
  disabled?: boolean;
}

export default function SpeedGauge({value,direction,caption,phase = 'idle',onStart,disabled = false}: SpeedGaugeProps) {
  const shown = useSmoothValue(value);
  const gradient = useId();
  const fraction = Math.sqrt(Math.min(Math.max(shown,0)/300,1));
  const tip = point(fraction,120);
  const Icon = phase === 'ping' ? Activity : direction === 'upload' ? ArrowUp : ArrowDown;
  const isIdle = phase === 'idle';
  const isFinished = phase === 'done' || phase === 'partial' || phase === 'cancelled';

  return <div className={`speed-dial ${direction === 'upload' ? 'is-upload' : ''} ${isIdle ? 'is-idle' : ''}`}>
    <svg viewBox="0 0 320 305" aria-hidden="true">
      <defs><linearGradient id={gradient}><stop stopColor="var(--dial-start)"/><stop offset="1" stopColor="var(--dial-end)"/></linearGradient></defs>
      <circle cx="160" cy="160" r="139" fill="none" stroke="var(--dial-halo)" strokeWidth="1"/>
      <circle cx="160" cy="160" r="131" fill="none" stroke="var(--dial-halo)" strokeWidth="4"/>
      {Array.from({length:25},(_,i) => {const a=point(i/24,102),b=point(i/24,i%4===0?94:98);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--text-dim)" opacity=".45" strokeWidth="1.5"/>;})}
      <path d={arc} fill="none" stroke="var(--border)" strokeWidth="13" strokeLinecap="round"/>
      <path d={arc} pathLength="100" fill="none" stroke={`url(#${gradient})`} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${fraction*100} 100`} opacity={shown > 0 ? 1 : 0}/>
      {[0,25,50,100,300].map(n => {const p=point(Math.sqrt(n/300),149);return <text key={n} x={p.x} y={p.y+4} textAnchor="middle" fill="var(--text-dim)" fontSize="10">{n===300?'300+':n}</text>;})}
      {shown>0 && <circle cx={tip.x} cy={tip.y} r="6.5" fill="var(--panel)" stroke="var(--dial-end)" strokeWidth="3"/>}
    </svg>

    {isIdle ? (
      <div className="dial-readout dial-idle-center">
        {onStart ? (
          <button
            type="button"
            className="dial-start-btn"
            onClick={onStart}
            disabled={disabled}
            aria-label="Start speed test"
          >
            <span className="dial-start-pulse" aria-hidden="true" />
            <span className="dial-start-label">
              <Play size={18} fill="currentColor" />
              <span>START</span>
            </span>
          </button>
        ) : null}
        <div className="dial-speed-value">
          <strong>0.0</strong>
          <span>Mbps</span>
        </div>
        <small>{caption}</small>
      </div>
    ) : isFinished ? (
      <div className="dial-readout dial-finished-center">
        <div className="dial-speed-value">
          <Icon size={20}/>
          <strong>{shown.toFixed(1)}</strong>
          <span>Mbps</span>
        </div>
        {onStart ? (
          <button
            type="button"
            className="dial-restart-btn"
            onClick={onStart}
            disabled={disabled}
            aria-label="Restart speed test"
          >
            <RotateCw size={13}/>
            <span>Restart</span>
          </button>
        ) : null}
        <small>{caption}</small>
      </div>
    ) : (
      <div className="dial-readout dial-running-center">
        <Icon size={25}/>
        <div className="dial-speed-value">
          <strong>{shown.toFixed(1)}</strong>
          <span>Mbps</span>
        </div>
        <small>{caption}</small>
      </div>
    )}
  </div>;
}

