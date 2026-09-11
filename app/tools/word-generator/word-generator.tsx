'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shuffle } from 'lucide-react';
import NepaliGenerator from './nepali-generator';

// Keep Nepali mounted when switching languages so its result remains independent.
export default function WordGenerator() {
  const [language, setLanguage] = useState<'nepali' | 'english'>('nepali');
  return <div className="page">
    <Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link>
    <div className="tool-heading"><span className="tool-icon"><Shuffle size={28}/></span><div><h1>Word Generator</h1><p>Choose a language. Discover something unexpected.</p></div></div>
    <fieldset className="mb-6">
      <legend className="mb-3 text-sm font-medium text-text">Choose a language</legend>
      <div className="flex flex-wrap gap-3">{(['nepali', 'english'] as const).map(option => <button key={option} type="button" aria-pressed={language === option} onClick={() => setLanguage(option)} className={`rounded-panel border bg-panel px-5 py-3 font-medium ${language === option ? 'border-accent text-accent' : 'border-border text-dim'}`}>
        {option === 'nepali' ? 'नेपाली · Nepali' : 'English'}
      </button>)}</div>
    </fieldset>
    <div hidden={language !== 'nepali'}><NepaliGenerator/></div>
    {language === 'english' && <section className="rounded-panel border border-border bg-panel p-8"><h2 className="text-xl font-semibold text-text">English is coming later</h2><p className="mt-3 text-dim">The English generator is not available yet. Choose Nepali to start generating words.</p></section>}
  </div>;
}
