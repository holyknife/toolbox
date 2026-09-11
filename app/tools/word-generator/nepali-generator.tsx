'use client';
import { useEffect, useState } from 'react';
import { Copy, Shuffle } from 'lucide-react';
import { randomWord, validateWords } from './random-word';

// Own the dataset and result here so future English features cannot change them.
export default function NepaliGenerator() {
  const [words, setWords] = useState<string[]>([]);
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  // Load the static list only with this tool, keeping it out of the shared JS bundle.
  useEffect(() => {
    const controller = new AbortController();
    async function loadWords() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/data/nepali_words_clean.json', { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load the Nepali words. Check your connection and try again.');
        const data: unknown = await response.json();
        if (!controller.signal.aborted) setWords(validateWords(data));
      } catch {
        if (!controller.signal.aborted) setError('Unable to load the Nepali word list. Check your connection and try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadWords();
    return () => controller.abort();
  }, [attempt]);

  // Each click makes a fresh, equally weighted draw from the entire list.
  function generate() {
    setMessage('');
    setError('');
    try { setWord(randomWord(words)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not generate a word. Please try again.'); }
  }

  // Keep the word selectable if clipboard permission is unavailable.
  async function copyWord() {
    try { await navigator.clipboard.writeText(word); setMessage('Word copied.'); }
    catch { setMessage('Copy was blocked. Select the word and copy it manually.'); }
  }

  return <section aria-label="Nepali word generator" aria-busy={loading} className="rounded-panel border border-border bg-panel p-6 sm:p-10">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-text">Random Nepali word</h2><span className="text-sm text-dim">{loading ? 'Loading word collection…' : `${words.length.toLocaleString('en-US')} words`}</span></div>
    <div className="flex min-h-56 items-center justify-center py-10 text-center" aria-live="polite" aria-atomic="true">
      {word ? <p lang="ne" className="max-w-full break-words text-4xl font-semibold leading-relaxed text-text sm:text-5xl">{word}</p> : <p className="text-dim">{loading ? 'Getting your words ready…' : 'Tap Generate to discover a word.'}</p>}
    </div>
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" className="primary-button !w-auto" disabled={loading || !words.length} onClick={generate}><Shuffle size={18}/>Generate word</button>
      <button type="button" className="rounded-panel border border-border bg-panel px-5 py-3 text-text disabled:opacity-50" disabled={!word} onClick={copyWord}><span className="flex items-center gap-2"><Copy size={16}/>Copy word</span></button>
    </div>
    <p className="mt-6 text-center text-sm text-dim">Every word has an equal chance. Repeats are possible.</p>
    {error && <div role="alert" className="mt-4 text-sm text-text">{error}{!words.length && <button type="button" className="ml-3 text-accent underline" onClick={() => setAttempt(value => value + 1)}>Retry loading</button>}</div>}
    <p role="status" className="mt-3 text-center text-sm text-dim">{message}</p>
  </section>;
}
