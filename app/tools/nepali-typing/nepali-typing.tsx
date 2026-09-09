'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Download, Languages, RotateCcw } from 'lucide-react';
import { storage } from '@/lib/storage';
import { applyTextEdit, commitWords, countText, emptyDraft, readDraft, replaceRange, type TypingDraft } from './editor-state';

type Engine = typeof import('./transliterate');
interface Suggestions { start: number; end: number; roman: string; options: string[] }

// Keep text, original Roman words, and selections local; no text goes to a server.
export default function NepaliTyping() {
  const [draft, setDraft] = useState<TypingDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const engine = useRef<Engine | null>(null);
  const composing = useRef(false);
  const pendingCaret = useRef<number | null>(null);
  const mounted = useRef(true);
  const saveNumber = useRef(0);
  const counts = countText(draft.text);

  // Lazy loading keeps package failures recoverable; English editing remains available.
  async function loadEngine() {
    setEngineError('');
    try {
      const loaded = await import('./transliterate');
      if (!mounted.current) return;
      engine.current = loaded;
      setEngineReady(true);
    } catch {
      if (mounted.current) setEngineError('Nepali typing could not load. Retry, or switch to English mode. Your text is safe.');
    }
  }

  // Restore before enabling editing so a slow read cannot replace freshly typed text.
  useEffect(() => {
    mounted.current = true;
    void loadEngine();
    storage.get<unknown>('nepali-typing','draft',{ strict:true })
      .then(value => { if (mounted.current) setDraft(readDraft(value)); })
      .catch(() => { if (mounted.current) setStorageError('Your saved draft could not be restored. Storage may be blocked or the saved data damaged. You can still write and download your text.'); })
      .finally(() => { if (mounted.current) setReady(true); });
    return () => { mounted.current = false; };
  }, []);

  // Restore the caret after React updates the controlled textarea, without a visible jump.
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !editor.current) return;
    editor.current.focus();
    editor.current.setSelectionRange(pendingCaret.current,pendingCaret.current);
    pendingCaret.current = null;
  }, [draft]);

  // Save every edit immediately through the shared adapter, including mode and word history.
  function updateDraft(next: TypingDraft, caret?: number) {
    setDraft(next);
    if (caret !== undefined) pendingCaret.current = caret;
    const currentSave = ++saveNumber.current;
    void storage.set('nepali-typing','draft',next).then(() => {
      if (mounted.current && currentSave === saveNumber.current) {
        setStorageError('');
        setMessage('Draft saved on this device.');
      }
    }).catch(() => {
      if (mounted.current) setStorageError('Your draft could not be saved. Storage may be full or blocked. Copy or download your text before leaving.');
    });
  }

  // Suggest the Roman word immediately before the caret while it is still being typed.
  function previewWord(text: string, caret: number) {
    if (!draft.nepali || !engine.current || composing.current) { setSuggestions(null); return; }
    const match = text.slice(0,caret).match(/[a-z]+$/i);
    if (!match) {
      // A delayed textarea selection event must not hide choices just opened by
      // Backspace. Keep them while the caret is still on that converted word.
      setSuggestions(previous => previous && caret >= previous.start && caret <= previous.end + 1 ? previous : null);
      return;
    }
    try {
      setSuggestions({ start:caret - match[0].length, end:caret, roman:match[0], options:engine.current.suggestionsFor(match[0]) });
    } catch { setActionError('This word could not be converted. Your original text has been kept.'); }
  }

  // Convert on a space, newline, or punctuation; native IME composition is left untouched.
  function changeText(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.currentTarget.value;
    const caret = event.currentTarget.selectionStart;
    const edit = applyTextEdit(draft,text);
    // Any text edit invalidates the previous popup's replacement range.
    setSuggestions(null);
    let next = edit.draft;
    let nextCaret = caret;
    setActionError('');
    if (draft.nepali && engine.current && !composing.current && edit.end > edit.start) {
      try {
        const result = commitWords(next,edit.start,edit.end,engine.current.transliterateWord);
        next = result.draft;
        nextCaret += result.caret - edit.end;
      } catch { setActionError('This word could not be converted. Your original text has been kept.'); }
    }
    updateDraft(next,nextCaret);
    previewWord(next.text,nextCaret);
  }

  // Saved Roman spellings let clicks reopen alternatives even after a page reload.
  function openConvertedWord(caret: number): boolean {
    if (!draft.nepali || !engine.current) return false;
    const word = draft.words.find(item => caret >= item.start && caret <= item.end)
      || draft.words.find(item => caret === item.end + 1 && /\s/.test(draft.text[item.end]));
    if (!word) return false;
    try {
      setSuggestions({ ...word, options:[...new Set([draft.text.slice(word.start,word.end), ...engine.current.suggestionsFor(word.roman)])] });
      return true;
    } catch { setActionError('Suggestions could not be loaded for this word. You can edit it directly.'); return false; }
  }

  // Replacing just the chosen range preserves surrounding English and later word positions.
  function chooseWord(value: string) {
    if (!suggestions) return;
    updateDraft(replaceRange(draft,suggestions.start,suggestions.end,value,suggestions.roman),suggestions.start + value.length);
    setSuggestions(null);
  }

  // Refine candidates without changing the document until a suggestion is chosen.
  function refineSpelling(roman: string) {
    if (!suggestions || !engine.current) return;
    try {
      setSuggestions({ ...suggestions, roman, options:engine.current.suggestionsFor(roman) });
    } catch { setActionError('Suggestions could not be refreshed. Your word has not changed.'); }
  }

  // Ctrl+G changes only future typing, allowing both languages in the same document.
  function toggleMode() {
    updateDraft({ ...draft, nepali:!draft.nepali });
    setSuggestions(null);
    editor.current?.focus();
  }

  // First Backspace opens alternatives; another Backspace performs ordinary deletion.
  function handleKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.ctrlKey && event.key.toLowerCase() === 'g') { event.preventDefault(); toggleMode(); return; }
    if (event.key === 'Escape') { setSuggestions(null); return; }
    if (event.key === 'ArrowDown' && suggestions) {
      event.preventDefault();
      document.getElementById('nepali-suggestion-0')?.focus();
    }
    if (event.key === 'Backspace' && !suggestions && event.currentTarget.selectionStart === event.currentTarget.selectionEnd && openConvertedWord(event.currentTarget.selectionStart)) {
      event.preventDefault();
    }
  }

  // Clipboard permissions differ across browsers; show a manual-copy fallback when needed.
  async function copyText() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(draft.text);
      setActionError('');
      setMessage('Text copied.');
    } catch { setActionError('Copy is unavailable here. Select your text and use your device’s Copy command.'); }
  }

  // UTF-8 text downloads stay local and temporary object URLs are released afterward.
  function downloadText() {
    try {
      const url = URL.createObjectURL(new Blob([draft.text],{ type:'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nepali-typing.txt';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url),1000);
      setActionError('');
      setMessage('Text download started.');
    } catch { setActionError('The download could not start. Please copy your text instead.'); }
  }

  // Clear also saves the empty draft, so a reload cannot bring back old writing.
  function clearText() {
    updateDraft({ ...emptyDraft, words:[] },0);
    setSuggestions(null);
    setActionError('');
  }

  return <div className="page">
    <Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link>
    <div className="tool-heading"><span className="tool-icon"><Languages size={28}/></span><div><h1>Nepali Typing</h1><p>Your words, in नेपाली.</p></div></div>
    <section className="rounded-panel border border-border bg-panel p-4 sm:p-7" aria-label="Nepali writing workspace">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold text-text">A little space to write</h2><p className="mt-1 text-sm text-dim">Type namaste, then press Space → नमस्ते</p></div>
        <button disabled={!ready} onClick={toggleMode} aria-pressed={draft.nepali} className="rounded-panel border border-border px-4 py-2 text-sm text-accent">{draft.nepali ? 'Nepali mode' : 'English mode'} <span className="ml-2 text-xs text-dim">Ctrl+G</span></button>
      </div>
      <label htmlFor="nepali-editor" className="mb-2 block text-sm font-medium text-text">Your text</label>
      <textarea id="nepali-editor" ref={editor} value={draft.text} disabled={!ready} onChange={changeText} onKeyDown={handleKey}
        onCompositionStart={() => { composing.current = true; setSuggestions(null); }}
        onCompositionEnd={() => { composing.current = false; }}
        onSelect={event => { if (event.currentTarget.selectionStart === event.currentTarget.selectionEnd) previewWord(event.currentTarget.value,event.currentTarget.selectionStart); }}
        onClick={event => { if (event.currentTarget.selectionStart === event.currentTarget.selectionEnd) openConvertedWord(event.currentTarget.selectionStart); }}
        aria-describedby="typing-help" aria-controls={suggestions ? 'nepali-suggestions' : undefined}
        spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder="namaste • tapai lai kasto chha"
        className="min-h-80 w-full resize-y rounded-panel border border-border bg-bg p-4 text-xl leading-loose text-text outline-none focus:border-accent sm:min-h-96"/>
      {suggestions && <div id="nepali-suggestions" className="mt-2 rounded-panel border border-border bg-bg p-3" aria-label="Word suggestions">
        <div className="mb-2 flex items-center justify-between gap-3"><p className="text-xs text-dim">Suggestions for <span className="text-text">{suggestions.roman}</span></p><button onClick={() => setSuggestions(null)} className="text-xs text-dim">Dismiss</button></div>
        <label htmlFor="suggestion-spelling" className="mb-3 block text-xs text-dim">Try another spelling
          <input id="suggestion-spelling" value={suggestions.roman} onChange={event => refineSpelling(event.target.value)}
            onKeyDown={event => { if (event.key === 'Escape') { setSuggestions(null); editor.current?.focus(); } }}
            autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="e.g. ma, maa, mma, mya"
            className="mt-1 block w-full rounded-panel border border-border bg-panel px-3 py-2 text-sm text-text outline-none focus:border-accent"/>
        </label>
        {!suggestions.options.length && <p className="mb-2 text-sm text-dim">Enter one word using English letters to see spellings.</p>}
        <div className="flex flex-wrap gap-2">{suggestions.options.map((value,index) => <button id={`nepali-suggestion-${index}`} key={value} onMouseDown={event => event.preventDefault()} onClick={() => chooseWord(value)}
          onKeyDown={event => { if (event.key === 'Escape') { setSuggestions(null); editor.current?.focus(); } }}
          className="rounded-panel border border-border bg-panel px-4 py-2 text-lg text-text focus:outline-accent">{value}</button>)}
          <button disabled={!suggestions.options.length} onMouseDown={event => event.preventDefault()} onClick={() => chooseWord(suggestions.roman)} className="rounded-panel border border-border px-3 py-2 text-sm text-dim">Keep {suggestions.roman}</button>
        </div>
      </div>}
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-dim"><span>{counts.characters.toLocaleString()} characters · {counts.words.toLocaleString()} words</span><span>{engineReady ? 'Offline transliteration · no text uploads' : 'Loading Nepali typing…'}</span></div>
      <p id="typing-help" className="mt-4 text-sm leading-relaxed text-dim">Space, Enter, or punctuation converts a word. Click a converted word or press Backspace after it to see alternatives. Press Backspace again to delete, or ↓ to enter suggestions. English mode keeps your letters as typed.</p>
      <p className="mt-2 text-xs leading-relaxed text-dim">Suggestions include alternate spellings and sound combinations. Use “Try another spelling” for more choices; these are not dictionary predictions. For precise spellings, try aa / ii / uu for long vowels, T / D / N for ट / ड / ण, and sh for श. Character counts include vowel marks and spaces.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={!draft.text} onClick={copyText} className="primary-button"><Copy size={16}/>Copy text</button>
        <button disabled={!draft.text} onClick={downloadText} className="flex items-center gap-2 rounded-panel border border-border px-4 py-2 text-sm text-text"><Download size={16}/>Download .txt</button>
        <button disabled={!ready || !draft.text} onClick={clearText} className="flex items-center gap-2 rounded-panel border border-border px-4 py-2 text-sm text-dim"><RotateCcw size={16}/>Clear</button>
      </div>
      <p role="status" className="mt-4 text-sm text-dim">{message}</p>
      {engineError && <p role="alert" className="mt-3 text-sm text-text">{engineError} <button onClick={() => void loadEngine()} className="text-accent underline">Retry loading</button></p>}
      {storageError && <p role="alert" className="mt-3 text-sm text-text">{storageError}</p>}
      {actionError && <p role="alert" className="mt-3 text-sm text-text">{actionError}</p>}
    </section>
  </div>;
}
