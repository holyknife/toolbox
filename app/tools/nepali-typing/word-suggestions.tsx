'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

interface Props {
  editor: RefObject<HTMLTextAreaElement>;
  offset: number;
  text: string;
  roman: string;
  options: string[];
  selected: number;
  onChoose: (value: string) => void;
  onRefine: (value: string) => void;
  onDismiss: () => void;
}

// A textarea does not expose caret coordinates. A hidden mirror uses the same
// font, padding, width, and wrapping; its marker locates the word even after scrolling.
function measureWord(editor: HTMLTextAreaElement, offset: number) {
  const style = getComputedStyle(editor);
  const mirror = document.createElement('div');
  for (const property of ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textIndent','tabSize','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','boxSizing'] as const) {
    mirror.style[property] = style[property];
  }
  Object.assign(mirror.style, {
    position:'fixed', visibility:'hidden', pointerEvents:'none', top:'0', left:'0',
    width:(editor.clientWidth + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)) + 'px', borderStyle:'solid', whiteSpace:'pre-wrap', overflowWrap:'break-word',
  });
  mirror.textContent = editor.value.slice(0,offset);
  const marker = document.createElement('span');
  marker.textContent = editor.value.slice(offset) || '\u200b';
  mirror.append(marker);
  document.body.append(mirror);
  try {
    return { left:marker.offsetLeft - editor.scrollLeft, top:marker.offsetTop - editor.scrollTop, lineHeight:parseFloat(style.lineHeight) || 32 };
  } finally { mirror.remove(); }
}

// Keep a small five-row chooser by the word, with two choices on either side
// of the active choice. Arrow navigation wraps, so both directions are useful.
export default function WordSuggestions({ editor, offset, text, roman, options, selected, onChoose, onRefine, onDismiss }: Props) {
  const popup = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left:0, top:0, visible:false });
  const [editing, setEditing] = useState(false);

  useLayoutEffect(() => {
    // Re-measure only when layout or scrolling changes, not on every animation frame.
    function placePopup() {
      const textarea = editor.current;
      const panel = popup.current;
      if (!textarea || !panel) return;
      const word = measureWord(textarea,offset);
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const rectangle = textarea.getBoundingClientRect();
      const below = word.top + word.lineHeight + 4;
      const fitsBelow = below + height <= textarea.clientHeight && rectangle.top + below + height <= window.innerHeight - 8;
      const top = fitsBelow ? below : Math.max(4,word.top - height - 4);
      setPosition({
        left:Math.max(4,Math.min(word.left,textarea.clientWidth - width - 4)),
        top,
        visible:word.top >= 0 && word.top < textarea.clientHeight,
      });
    }
    placePopup();
    const textarea = editor.current;
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(placePopup) : null;
    if (textarea) observer?.observe(textarea);
    if (popup.current) observer?.observe(popup.current);
    textarea?.addEventListener('scroll',placePopup);
    window.addEventListener('resize',placePopup);
    window.addEventListener('scroll',placePopup,true);
    return () => {
      observer?.disconnect();
      textarea?.removeEventListener('scroll',placePopup);
      window.removeEventListener('resize',placePopup);
      window.removeEventListener('scroll',placePopup,true);
    };
  }, [editor,offset,text,editing]);

  const count = Math.min(5,options.length);
  const above = Math.floor(count / 2);
  const visible = Array.from({ length:count },(_,row) => (selected + row - above + options.length) % options.length);

  return <div ref={popup} className="absolute z-20 w-56 max-w-[calc(100%-8px)] overflow-hidden rounded-panel border border-border bg-panel"
    style={{ left:position.left, top:position.top, visibility:position.visible ? 'visible' : 'hidden' }}
    onMouseDown={event => { if (!(event.target instanceof HTMLInputElement)) event.preventDefault(); }}>
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs text-dim">
      <span className="truncate">{roman}</span><button onClick={onDismiss} aria-label="Close suggestions">Esc ×</button>
    </div>
    <div id="nepali-suggestions" role="listbox" aria-label="Word suggestions">
      {visible.map(index => <button key={index} id={`nepali-suggestion-${index}`} role="option" aria-selected={selected === index}
        tabIndex={-1} onClick={() => onChoose(options[index])}
        className={`block h-8 w-full px-3 text-left text-lg ${selected === index ? 'border-y border-border bg-bg font-semibold text-accent' : 'text-dim'}`}>{options[index]}</button>)}
    </div>
    {!options.length && <p className="p-3 text-xs text-dim">Type one word in English letters.</p>}
    <div className="border-t border-border px-3 py-2 text-xs text-dim">
      <p>↑ ↓ choose · Enter apply</p>
      <button className="mt-1 text-accent" onClick={() => setEditing(value => !value)}>Try another spelling</button>
      {editing && <input autoFocus aria-label="Try another spelling" value={roman} onChange={event => onRefine(event.target.value)}
        onKeyDown={event => { if (event.key === 'Escape') { onDismiss(); editor.current?.focus(); } }}
        autoCapitalize="off" autoComplete="off" spellCheck={false}
        className="mt-2 w-full rounded-panel border border-border bg-bg px-2 py-1 text-sm text-text"/>}
    </div>
  </div>;
}
