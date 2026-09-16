import { ArrowRight, Gauge, Image, QrCode } from 'lucide-react';

// Decorative, local artwork: no image downloads and no tool state.
export default function ToolArtwork({ slug }: { slug: string }) {
  return <div className={`feature-art extra-art art-${slug}`} aria-hidden="true">
    {slug === 'word-generator' && <div className="letter-tiles"><span className="letter-tile tile-back">अ<small>1</small></span><span className="letter-tile tile-front">A<small>1</small></span><span className="letter-tile tile-last">Z<small>10</small></span></div>}
    {slug === 'preeti-to-unicode' && <div className="conversion-art"><span className="type-sheet sheet-back">T<span className="sheet-line"/><span className="sheet-line"/></span><span className="type-sheet sheet-front">अ<span className="sheet-line"/><span className="sheet-line"/></span><span className="conversion-arrow"><ArrowRight size={22}/></span></div>}
    {slug === 'speed-test' && <div className="dial-art"><Gauge size={100} strokeWidth={1.2}/><span className="dial-label">Mbps</span><span className="dial-dot"/></div>}
    {slug === 'photo-compressor' && <div className="photo-stack"><span className="photo-print print-back"><Image size={80} strokeWidth={1}/></span><span className="photo-print print-front"><svg viewBox="0 0 100 80"><rect width="100" height="80" fill="#d5e5e0"/><circle cx="73" cy="21" r="10" fill="#f4d69a"/><path d="M0 67 32 23 66 67Z" fill="#79a395"/><path d="m35 80 40-48 25 33v15Z" fill="#426e61"/><path d="m23 36 9-13 10 13-10-4Z" fill="#f5f7ef"/></svg></span></div>}
    {slug === 'date-converter' && <div className="calendar-art"><div className="calendar-binding"><i/><i/></div><div className="calendar-header">AD · BS</div><strong>१६</strong><div className="calendar-grid">{Array.from({length:14},(_,i)=><i key={i}/>)}</div></div>}
    {slug === 'qr-generator' && <div className="qr-art"><div className="qr-paper"><QrCode size={94} strokeWidth={1.6}/><span className="qr-caption">SCAN & GO</span></div><span className="qr-scan"/></div>}
  </div>;
}
