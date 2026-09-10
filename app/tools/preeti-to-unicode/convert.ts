import { preetiMap } from './preeti-map';

export type RaVariant = 'rakaar' | 'eyelash';
export interface Conversion { text: string; warnings: string[] }
const consonant = '[क-ह]';
const cluster = `${consonant}(?:्${consonant})*`;
const signs = '[ािीुूृेैोौंःँॅ]';

// A Preeti extension stroke changes a nearby glyph, rather than adding a letter.
// Limit its reach to vowel signs/rakaar so malformed input cannot move across words.
function resolveExtensions(text: string): string {
  const extended: Record<string,string> = { 'प':'फ', 'भ':'झ', 'उ':'ऊ', 'त्र':'क्र', 'त्त':'क्त' };
  return text.replace(/(त्र|त्त|प|भ|उ)((?:्र)?[ािीुूृेैोौंःँॅ]*्?)m/g,
    (_, base: string, marks: string) => extended[base] + marks);
}

// Preeti places short i visually before its cluster; Unicode stores it after.
// Reph is the opposite: a trailing { becomes र् before the entire cluster.
function orderSyllables(text: string): string {
  let ordered = text.replace(/इ\{/g,'ई');
  ordered = ordered.replace(new RegExp(`ि(${cluster})`,'g'),'$1ि');
  ordered = ordered.replace(new RegExp(`(${cluster}${signs}*)\\{`,'g'),'र्$1');
  // A vowel typed between a half-form and its final consonant belongs at the end.
  ordered = ordered.replace(new RegExp(`(${consonant})(${signs}+)(्${cluster})`,'g'),'$1$3$2');
  ordered = ordered.replace(new RegExp(`्(${signs}+)(${cluster})`,'g'),'्$2$1');
  return ordered.replace(/([ंँ])([ािीुूृेैोौॅ]+)/g,'$2$1');
}

// Compose visual vowel pieces without spell-checking or deleting repeated marks.
function composeVowels(text: string): string {
  return text.replace(/ेा/g,'ाे').replace(/ैा/g,'ाै')
    .replace(/अाे/g,'ओ').replace(/अाै/g,'औ').replace(/अा/g,'आ')
    .replace(/एे/g,'ऐ').replace(/ाे/g,'ो').replace(/ाै/g,'ौ');
}

// Convert only legacy runs. Existing Unicode and whitespace never enter reordering.
function convertRun(source: string, variant: RaVariant): string {
  let mapped = Array.from(source, character => character === '¥' && variant === 'eyelash'
    ? 'र्\u200d' : preetiMap[character] ?? character).join('');
  // A half-form followed by the vertical bar makes its full consonant, not "kaa".
  mapped = mapped.replace(/्ा/g,'').replace(/टृ/g,'ट्ट');
  return composeVowels(orderSyllables(resolveExtensions(mapped)));
}

// Fully offline. No text is sent to a service; unknown characters are preserved.
// Plain text has no font metadata, so English inside a Preeti run is ambiguous.
export function convertPreeti(source: string, variant: RaVariant = 'rakaar'): Conversion {
  const pieces: string[] = [];
  let run = '';
  const unknown = new Set<string>();
  const flush = () => { if (run) pieces.push(convertRun(run,variant)); run = ''; };
  for (const character of source) {
    if (Object.hasOwn(preetiMap,character) || character === 'm' || character === '{') {
      run += character;
    } else {
      flush();
      pieces.push(character);
      if (!/[\s\u0900-\u097f\u200c\u200d]/u.test(character)) unknown.add(character);
    }
  }
  flush();
  const text = pieces.join('');
  const warnings: string[] = [];
  if (unknown.size) warnings.push('Some characters are outside the supported Preeti map and were kept unchanged. Check the source font and review the result.');
  if (/[m{]/.test(text)) warnings.push('An extension stroke (m) or reph ({) could not be attached to a valid syllable. It was kept unchanged for review.');
  if (/(?:^|\s)[ािीुूृेैोौंःँॅ्]|[ािीुूृेैोौॅ]{2}/u.test(text)) warnings.push('Some vowel signs appear incomplete or repeated. Check these against the original document.');
  return { text, warnings };
}
