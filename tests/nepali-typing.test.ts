import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transliterateText, transliterateWord, suggestionsFor } from '../app/tools/nepali-typing/transliterate';
import { applyTextEdit, commitWords, countText, emptyDraft, readDraft, replaceRange } from '../app/tools/nepali-typing/editor-state';
import { storage } from '../lib/storage';

test('offline Nepali conversions handle common spellings and phonetic fallback', () => {
  assert.equal(transliterateWord('namaste'),'नमस्ते');
  assert.equal(transliterateWord('dhanyabad'),'धन्यवाद');
  assert.equal(transliterateText('tapai lai kasto chha'),'तपाईं लाई कस्तो छ');
  assert.equal(transliterateText('mero ghar 123!\nnamaste'),'मेरो घर 123!\nनमस्ते');
  assert.equal(transliterateWord('kalam'),'कलम');
  assert.ok(suggestionsFor('pani').includes('पानी'));
  assert.ok(suggestionsFor('pani').includes('पनि'));
});

test('word commits handle spaces, enter, paste, and preserve earlier English', () => {
  let draft = { ...emptyDraft, text:'English text: ', words:[] };
  const edit = applyTextEdit(draft,'English text: namaste dhanyabad\n');
  const result = commitWords(edit.draft,edit.start,edit.end,transliterateWord);
  assert.equal(result.draft.text,'English text: नमस्ते धन्यवाद\n');
  assert.equal(result.caret,result.draft.text.length);
  assert.deepEqual(result.draft.words.map(word => word.roman),['namaste','dhanyabad']);
  const first = result.draft.words[0];
  const changed = replaceRange(result.draft,first.start,first.end,'नमस्कार',first.roman);
  assert.equal(changed.text.slice(changed.words[1].start,changed.words[1].end),'धन्यवाद');
  const deleted = replaceRange(changed,changed.words[1].start,changed.words[1].end,'');
  assert.equal(deleted.words.length,1);
});

test('typing and selection edits keep unconverted text and word positions', () => {
  const initial = commitWords({ ...emptyDraft,text:'namaste pani ',words:[] },0,13,transliterateWord).draft;
  const edited = applyTextEdit(initial,'Hi '+initial.text).draft;
  assert.equal(edited.words[0].start,3);
  assert.equal(edited.text.slice(edited.words[1].start,edited.words[1].end),'पनि');
  assert.deepEqual(countText('नमस्ते world'),{characters:12,words:2});
  assert.equal(transliterateText('नमस्ते १२३'),'नमस्ते १२३');
});

test('draft save/restore uses the shared adapter, retains word history, and reports corruption', async () => {
  const data = new Map<string,string>();
  Object.defineProperty(globalThis,'window',{ configurable:true,value:{ localStorage:{
    getItem:(key:string) => data.get(key) ?? null,
    setItem:(key:string,value:string) => { data.set(key,value); },
    removeItem:(key:string) => { data.delete(key); },
  } } });
  try {
    const draft = commitWords({ ...emptyDraft,text:'namaste ',words:[] },0,8,transliterateWord).draft;
    await storage.set('nepali-typing','draft',draft);
    assert.deepEqual(readDraft(await storage.get('nepali-typing','draft',{strict:true})),draft);
    assert.equal(await storage.get('other-tool','draft'),null);
    data.set('toolbox:v1:nepali-typing:draft','broken JSON');
    await assert.rejects(storage.get('nepali-typing','draft',{strict:true}),/damaged/);
    assert.throws(() => readDraft({ ...draft,words:[{start:-1,end:2,roman:'test'}] }),/invalid/);
    assert.throws(() => readDraft({version:2}),/could not be read/);
    await storage.set('nepali-typing','draft',emptyDraft);
    assert.equal(readDraft(await storage.get('nepali-typing','draft')).text,'');
    Object.defineProperty(window,'localStorage',{value:{setItem:() => {throw new Error('Quota exceeded');}}});
    await assert.rejects(storage.set('nepali-typing','draft',draft),/Quota/);
  } finally { Reflect.deleteProperty(globalThis,'window'); }
});

test('short syllables offer doubled consonants, ya forms, and long vowels offline', () => {
  const choices = suggestionsFor('ma');
  for (const expected of ['म','मा','म्म','म्य','म्या']) assert.ok(choices.includes(expected),expected);
  assert.equal(choices[0],'म');
  assert.ok(suggestionsFor('ka').includes('क्या'));
  assert.ok(suggestionsFor('kalam').includes('कालम'));
  assert.deepEqual(suggestionsFor('two words'),[]);
  assert.deepEqual(suggestionsFor(''),[]);
  assert.equal(new Set(choices).size,choices.length);
  assert.ok(suggestionsFor('dhanyabad').length <= 12);
});

test('choosing and saving a refined spelling preserves its replacement range', () => {
  const original = commitWords({ ...emptyDraft,text:'ma namaste ',words:[] },0,11,transliterateWord).draft;
  const chosen = replaceRange(original,original.words[0].start,original.words[0].end,'म्या','myaa');
  const restored = readDraft(JSON.parse(JSON.stringify(chosen)));
  assert.equal(restored.text,'म्या नमस्ते ');
  assert.equal(restored.words[0].roman,'myaa');
  assert.ok(suggestionsFor(restored.words[0].roman).includes('म्या'));
  assert.equal(restored.text.slice(restored.words[1].start,restored.words[1].end),'नमस्ते');
});
