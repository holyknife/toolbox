export interface ConvertedWord { start: number; end: number; roman: string }
export interface TypingDraft { version: 1; text: string; nepali: boolean; words: ConvertedWord[] }
export const emptyDraft: TypingDraft = { version:1, text:'', nepali:true, words:[] };

// Validate persisted data before it reaches selection offsets or the editor.
export function readDraft(value: unknown): TypingDraft {
  if (value === null) return { ...emptyDraft, words:[] };
  const draft = value as TypingDraft;
  if (!draft || draft.version !== 1 || typeof draft.text !== 'string' || typeof draft.nepali !== 'boolean' || !Array.isArray(draft.words)) {
    throw new Error('Your saved draft could not be read. You can start a new draft.');
  }
  let previousEnd = 0;
  for (const word of draft.words) {
    if (!word || !Number.isInteger(word.start) || !Number.isInteger(word.end) || word.start < previousEnd || word.end <= word.start || word.end > draft.text.length || typeof word.roman !== 'string' || !/^[a-z]+$/i.test(word.roman)) {
      throw new Error('Your saved draft contains invalid word data. You can start a new draft.');
    }
    previousEnd = word.end;
  }
  return draft;
}

// Shift untouched word ranges after an edit and forget ranges whose text was changed.
export function replaceRange(draft: TypingDraft, start: number, end: number, replacement: string, roman?: string): TypingDraft {
  const difference = replacement.length - (end - start);
  const words: ConvertedWord[] = [];
  for (const word of draft.words) {
    if (word.end <= start) words.push(word);
    else if (word.start >= end) words.push({ ...word, start:word.start + difference, end:word.end + difference });
  }
  if (roman) words.push({ start, end:start + replacement.length, roman });
  words.sort((first, second) => first.start - second.start);
  return { ...draft, text:draft.text.slice(0,start) + replacement + draft.text.slice(end), words };
}

// A single contiguous diff covers typing, deletion, selection replacement, and paste.
export function applyTextEdit(draft: TypingDraft, text: string): { draft: TypingDraft; start: number; end: number } {
  let start = 0;
  while (start < draft.text.length && start < text.length && draft.text[start] === text[start]) start++;
  let oldEnd = draft.text.length;
  let newEnd = text.length;
  while (oldEnd > start && newEnd > start && draft.text[oldEnd - 1] === text[newEnd - 1]) { oldEnd--; newEnd--; }
  return { draft:replaceRange(draft,start,oldEnd,text.slice(start,newEnd)), start, end:newEnd };
}

// Commit completed words in the edited region only, preserving earlier English-mode text.
export function commitWords(draft: TypingDraft, start: number, end: number, convert: (word: string) => string): { draft: TypingDraft; caret: number } {
  let first = start;
  while (first > 0 && /[a-z]/i.test(draft.text[first - 1])) first--;
  const matches = [...draft.text.slice(first,end).matchAll(/[a-z]+(?=[\s.,!?;:])/gi)];
  let next = draft;
  let caret = end;
  // Work right to left so earlier offsets remain valid as converted lengths change.
  for (const match of matches.reverse()) {
    const position = first + match.index!;
    const converted = convert(match[0]);
    next = replaceRange(next,position,position + match[0].length,converted,match[0]);
    caret += converted.length - match[0].length;
  }
  return { draft:next, caret };
}

// Unicode code points count combining marks individually; words are whitespace-separated.
export function countText(text: string): { characters: number; words: number } {
  return { characters:Array.from(text).length, words:text.trim() ? text.trim().split(/\s+/u).length : 0 };
}
