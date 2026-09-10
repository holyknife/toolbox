'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Copy, Download, Type, RotateCcw } from 'lucide-react';
import { convertPreeti, type RaVariant } from './convert';

const sample = 'gd:t] !\ng]kfnL efiff\nljsf; / lzIff\nsf7df08"';
const editorClass = 'min-h-72 w-full resize-y rounded-panel border border-border bg-bg p-4 text-lg leading-loose text-text focus:outline-none focus:ring-2 focus:ring-accent';

// Keep source and output separate so conversion never overwrites the pasted text.
export default function PreetiConverter() {
  const [source, setSource] = useState('');
  const [variant, setVariant] = useState<RaVariant>('rakaar');
  const [message, setMessage] = useState('');
  const result = useMemo(() => convertPreeti(source,variant),[source,variant]);

  // Clipboard permission can be unavailable; keep selectable output as a fallback.
  async function copyText() {
    try {
      await navigator.clipboard.writeText(result.text);
      setMessage('Unicode text copied.');
    } catch { setMessage('Copy was blocked. Select the Unicode text and copy it manually.'); }
  }

  // UTF-8 preserves Nepali characters without requiring the Preeti font to read them.
  function downloadText() {
    try {
      const url = URL.createObjectURL(new Blob([result.text],{type:'text/plain;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url; link.download = 'nepali-unicode.txt'; link.click();
      setTimeout(() => URL.revokeObjectURL(url),1000);
      setMessage('Unicode text download started.');
    } catch { setMessage('The download could not start. You can still copy the Unicode text.'); }
  }

  // Editing clears old action messages so they cannot refer to a previous result.
  function changeSource(text: string) { setSource(text); setMessage(''); }

  return <div className="page">
    <Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link>
    <div className="tool-heading"><span className="tool-icon"><Type size={28}/></span><div><h1>Preeti to Unicode</h1><p>Your old Nepali text, ready to use everywhere.</p></div></div>
    <section className="rounded-panel border border-border bg-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-dim">Paste Preeti text. Unicode appears as you type. Fully offline conversion.</p>
        <button type="button" className="text-sm font-medium text-accent" onClick={() => changeSource(sample)}>Try an example</button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div><label htmlFor="preeti-source" className="mb-2 block text-sm font-medium text-text">Preeti source</label>
          <textarea id="preeti-source" className={editorClass} value={source} onChange={event => changeSource(event.target.value)} placeholder="Paste text copied from a Preeti document, e.g. g]kfnL" spellCheck={false} autoCorrect="off" autoCapitalize="off"/>
          <p className="mt-2 text-xs leading-relaxed text-dim">Latin-looking symbols here are normal: this shows the stored text, without applying the Preeti font. Paste only the Preeti portions of a mixed-font document.</p>
        </div>
        <div><label htmlFor="unicode-output" className="mb-2 flex items-center gap-2 text-sm font-medium text-text"><ArrowRight size={14}/>Unicode result</label>
          <textarea id="unicode-output" className={editorClass} value={result.text} readOnly lang="ne" placeholder="नेपाली पाठ यहाँ देखिन्छ"/>
          <p className="mt-2 text-xs text-dim">{Array.from(result.text).length.toLocaleString()} characters · {result.text.trim() ? result.text.trim().split(/\s+/u).length.toLocaleString() : 0} words</p>
        </div>
      </div>
      {source.includes('¥') && <label className="mt-5 block text-sm text-text">Your text contains ¥, which differs between legacy font mappings.
        <select className="mt-2 block rounded-panel border border-border bg-bg p-2 text-text" value={variant} onChange={event => setVariant(event.target.value as RaVariant)}>
          <option value="rakaar">Use rakaar (्र) — npttf2utf mapping</option>
          <option value="eyelash">Use eyelash ra (र्‍) — Shuvayatra mapping</option>
        </select>
      </label>}
      {!!result.warnings.length && <div role="status" className="mt-5 rounded-panel border border-border bg-bg p-4 text-sm text-text"><p className="mb-2 font-semibold">Review these details</p><ul className="list-disc space-y-1 pl-5">{result.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></div>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="primary-button !w-auto" disabled={!result.text} onClick={copyText}><Copy size={16}/>Copy Unicode</button>
        <button type="button" className="flex items-center gap-2 rounded-panel border border-border px-4 py-2 text-sm text-text disabled:opacity-50" disabled={!result.text} onClick={downloadText}><Download size={16}/>Download .txt</button>
        <button type="button" className="flex items-center gap-2 rounded-panel border border-border px-4 py-2 text-sm text-dim disabled:opacity-50" disabled={!source} onClick={() => { changeSource(''); setVariant('rakaar'); }}><RotateCcw size={16}/>Clear</button>
      </div>
      <p role="status" className="mt-3 text-sm text-accent">{message}</p>
    </section>
    <div className="mt-5 rounded-panel border border-border bg-panel p-5 text-sm leading-relaxed text-dim">
      <h2 className="mb-2 font-semibold text-text">Converting a document?</h2>
      <p>Copy its Preeti text from Word or another editor and paste it above. This converts text, not document formatting or scanned images. Already-Unicode Nepali is preserved. English letters cannot be reliably distinguished from Preeti without the original font information.</p>
      <p className="mt-2">For English spellings such as “namaste”, use <Link href="/tools/nepali-typing" className="text-accent underline">Nepali Typing</Link>. Check names and unusual legacy symbols against the original before using an important document.</p>
    </div>
  </div>;
}
