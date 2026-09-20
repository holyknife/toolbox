'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { searchCommands } from '@/lib/command-search';

const openEvent = 'toolbox:open-command-palette';

// Both the header and home search launch the same persistent palette.
export function CommandTrigger({compact = false}: {compact?:boolean}) {
  const [shortcut,setShortcut] = useState('Ctrl K');
  useEffect(() => { if (/Mac|iPhone|iPad/.test(navigator.platform)) setShortcut('⌘ K'); },[]);
  return <button type="button" className="command-trigger" aria-label="Open command palette" title={`Find any tool (${shortcut})`}
    onClick={() => document.dispatchEvent(new Event(openEvent))}>
    {!compact && <Search size={16}/>}<kbd>{shortcut}</kbd>
  </button>;
}

// Native modal dialog supplies focus containment and makes the background inert.
export default function CommandPalette() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [open,setOpen] = useState(false);
  const [query,setQuery] = useState('');
  const [selected,setSelected] = useState(0);
  const matches = searchCommands(query);
  const active = matches[selected];

  useEffect(() => {
    const show = () => {
      if (dialog.current?.open) return;
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setQuery(''); setSelected(0); setOpen(true);
    };
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k' && !event.isComposing) {
        event.preventDefault();
        if (event.repeat) return;
        if (dialog.current?.open) setOpen(false); else show();
      }
    };
    document.addEventListener(openEvent,show);
    document.addEventListener('keydown',shortcut);
    return () => { document.removeEventListener(openEvent,show); document.removeEventListener('keydown',shortcut); };
  },[]);

  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    dialog.current?.showModal(); input.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.current?.close(); document.body.style.overflow = overflow;
      if (returnFocus.current?.isConnected) returnFocus.current.focus({preventScroll:true});
    };
  },[open]);

  // Scroll the active row, keeping keyboard focus and typing in the search input.
  useEffect(() => {
    if (open) document.getElementById(`command-${selected}`)?.scrollIntoView({block:'nearest'});
  },[selected,query,open]);

  function navigate(href: string) { setOpen(false); router.push(href); }

  return <dialog ref={dialog} className="command-dialog" aria-labelledby="command-title"
    onCancel={event => { event.preventDefault(); setOpen(false); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
    }}>
    <h2 id="command-title" className="sr-only">Jump to a tool</h2>
    <div className="flex items-center gap-3 border-b border-border p-4">
      <Search size={18} className="text-dim"/>
      <input ref={input} role="combobox" aria-label="Find a tool" aria-expanded={open} aria-controls="command-results" aria-autocomplete="list"
        aria-activedescendant={active ? `command-${selected}` : undefined} autoComplete="off" spellCheck={false}
        placeholder="Find a tool or calculator…" className="min-w-0 flex-1 bg-panel text-text outline-none" value={query}
        onChange={event => { setQuery(event.target.value); setSelected(0); }}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (matches.length) setSelected(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + matches.length)%matches.length);
          }
          if (event.key === 'Enter' && active) { event.preventDefault(); navigate(active.href); }
        }}/>
      <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close command palette"><X size={16}/></button>
    </div>
    <div id="command-results" role="listbox" aria-label="Tools" className="command-results">
      {matches.map((command,index) => <div key={command.href} id={`command-${index}`} role="option" aria-selected={selected === index}
        className={`command-option ${selected === index ? 'command-selected' : ''}`}
        onMouseDown={event => event.preventDefault()} onMouseMove={() => setSelected(index)} onClick={() => navigate(command.href)}>
        <div><span className="block text-sm font-medium">{command.name}</span><span className="mt-1 block text-xs text-dim">{command.category}</span></div><ArrowUpRight size={16}/>
      </div>)}
    </div>
    {!matches.length && <p role="status" className="p-6 text-center text-sm text-dim">No tools found. Try another name or a few letters.</p>}
    <div className="flex flex-wrap gap-4 border-t border-border px-4 py-3 text-xs text-dim"><span>↑ ↓ to choose</span><span>Enter to open</span><span>Esc to close</span></div>
  </dialog>;
}
