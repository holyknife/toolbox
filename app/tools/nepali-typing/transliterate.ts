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

// Offer local spellings plus literal ITRANS and explicit final-halant variants.
export function suggestionsFor(roman: string): string[] {
  if (!/^[a-z]+$/i.test(roman)) return [];
  const preferred = commonWords[roman.toLowerCase()] || [];
  const literal = Sanscript.t(roman, 'itrans', 'devanagari', { syncope:true });
  const precise = Sanscript.t(roman, 'itrans', 'devanagari');
  return [...new Set([...preferred, literal, precise])];
}

// Convert phrases without changing whitespace, numbers, or punctuation.
export function transliterateText(text: string): string {
  return text.replace(/[a-z]+/gi, transliterateWord);
}
