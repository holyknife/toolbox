import Sanscript from '@indic-transliteration/sanscript';

// Fully offline: Sanscript and this small spelling list ship in the app bundle.
// No Google endpoint, network request, or remote prediction service receives text.
// These common Nepali spellings supplement ITRANS, which is primarily Sanskrit.
// Extend this list for vocabulary you use often; it is not a predictive dictionary.
const commonWords: Record<string, string[]> = {
  namaste:['नमस्ते'], dhanyabad:['धन्यवाद'], dhanyavaad:['धन्यवाद'],
  tapai:['तपाईं','तपाई'], tapailai:['तपाईंलाई'], lai:['लाई','लाइ'],
  kasto:['कस्तो'], chha:['छ'], cha:['छ','च'], chhu:['छु'], chhau:['छौ'],
  chhan:['छन्'], chhaina:['छैन'], chhata:['छाता'], ma:['म','मा'],
  maa:['मा','म'], mero:['मेरो'], meri:['मेरी'], hamro:['हाम्रो'],
  ramro:['राम्रो'], ramri:['राम्री'], nepal:['नेपाल'], nepali:['नेपाली'],
  namaskar:['नमस्कार'], hajur:['हजुर'], sanchai:['सन्चै','सञ्चै'],
  thik:['ठीक','ठिक'], thikai:['ठीकै'], ho:['हो'], haina:['होइन','हैन'],
  timi:['तिमी'], timro:['तिम्रो'], hami:['हामी'], sabai:['सबै'],
  sathi:['साथी'], sathiharu:['साथीहरू'], haru:['हरू'], pani:['पनि','पानी'],
  paani:['पानी'], aaja:['आज'], aja:['आज'], bholi:['भोलि'], hijo:['हिजो'],
  ghar:['घर'], kaam:['काम'], ka:['का','क'], ko:['को'], ki:['कि','की'],
  ra:['र'], ani:['अनि'], nam:['नाम'], naam:['नाम'], maya:['माया'],
  garnu:['गर्नु'], garchhu:['गर्छु'], huncha:['हुन्छ'], hunchha:['हुन्छ'],
};

// Convert one Roman word; preserve intentional ITRANS capitals (T, D, N, etc.).
export function transliterateWord(roman: string): string {
  if (!/^[a-z]+$/i.test(roman)) return roman;
  return commonWords[roman.toLowerCase()]?.[0]
    || Sanscript.t(roman, 'itrans', 'devanagari', { syncope:true });
}

// Generate single sound changes, not every combination, so suggestions stay useful
// and a long word cannot cause an exponential amount of work. These are spelling
// possibilities, not claims that each result is a dictionary word.
function phoneticVariants(roman: string): string[] {
  const variants: string[] = [];
  const syllable = roman.match(/^(kh|gh|chh|ch|jh|th|dh|ph|bh|[kgcjtdnpbmrlyvsh])([aiueo]|aa|ii|uu|ai|au)$/i);
  if (syllable) {
    const consonant = syllable[1];
    const vowel = syllable[2];
    variants.push(consonant + consonant + vowel);
    variants.push(consonant + 'y' + vowel);
    if (vowel === 'a') variants.push(consonant + 'yaa');
  }

  // Short/long vowels and familiar Roman ambiguities provide choices for any word.
  const sounds = roman.matchAll(/aa|ii|ee|uu|oo|ai|au|sh|chh|ch|[aiuvbs]/g);
  const alternatives: Record<string,string[]> = {
    a:['aa'], aa:['a'], i:['ii'], ii:['i'], ee:['i','ii'],
    u:['uu'], uu:['u'], oo:['u','uu'], ai:['aa'], au:['o'],
    b:['v'], v:['b'], s:['sh'], sh:['s'], ch:['chh'], chh:['ch'],
  };
  for (const sound of sounds) {
    for (const replacement of alternatives[sound[0]] || []) {
      const start = sound.index!;
      variants.push(roman.slice(0,start) + replacement + roman.slice(start + sound[0].length));
      if (variants.length >= 16) return variants;
    }
  }
  return variants;
}

// Preserve the familiar first choice, then offer other locally generated spellings.
// No external prediction API is used; users can refine the Roman spelling in the UI.
export function suggestionsFor(roman: string): string[] {
  if (!/^[a-z]+$/i.test(roman)) return [];
  const preferred = commonWords[roman.toLowerCase()] || [];
  const literal = Sanscript.t(roman, 'itrans', 'devanagari', { syncope:true });
  const precise = Sanscript.t(roman, 'itrans', 'devanagari');
  const variants = phoneticVariants(roman).map(value =>
    Sanscript.t(value, 'itrans', 'devanagari', { syncope:true }));
  return [...new Set([...preferred, literal, ...variants, precise])].slice(0,12);
}

// Convert phrases without changing whitespace, numbers, or punctuation.
export function transliterateText(text: string): string {
  return text.replace(/[a-z]+/gi, transliterateWord);
}
