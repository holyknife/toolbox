'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shuffle } from 'lucide-react';
import LanguageGenerator from './language-generator';

// Keep separate instances mounted after first use; switching preserves both results.
export default function WordGenerator() {
  const [englishOpened, setEnglishOpened] = useState(false);
  const [language, setLanguage] = useState<'nepali' | 'english'>('nepali');
  return <div className="page">
    <Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link>
    <div className="tool-heading"><span className="tool-icon"><Shuffle size={28}/></span><div><h1>Word Generator</h1><p>Choose a language. Discover something unexpected.</p></div></div>
    <fieldset className="mb-6">
      <legend className="mb-3 text-sm font-medium text-text">Choose a language</legend>
      <div className="flex flex-wrap gap-3">{(['nepali', 'english'] as const).map(option => <button key={option} type="button" aria-pressed={language === option} onClick={() => { setLanguage(option); if (option === 'english') setEnglishOpened(true); }} className={`rounded-panel border bg-panel px-5 py-3 font-medium ${language === option ? 'border-accent text-accent' : 'border-border text-dim'}`}>
        {option === 'nepali' ? 'नेपाली · Nepali' : 'English'}
      </button>)}</div>
    </fieldset>
    <div hidden={language !== 'nepali'}><LanguageGenerator language="Nepali" languageCode="ne" dataUrl="/data/nepali_words_clean.json"/></div>
    {englishOpened && <div hidden={language !== 'english'}><LanguageGenerator language="English" languageCode="en" dataUrl="/data/english_words_clean.json"/></div>}
  </div>;
}
