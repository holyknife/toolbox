import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertPreeti } from '../app/tools/preeti-to-unicode/convert';

// Literal expected words verify logical Unicode, not just how a font displays it.
test('Preeti converts familiar words and phrases without phonetic transliteration', () => {
  const examples = [
    ['gd:t]','नमस्ते'], ['wGojfb','धन्यवाद'], ['g]kfnL efiff','नेपाली भाषा'],
    ['sf7df08"','काठमाण्डू'], [';lag cfrfo{','सबिन आचार्य'],
    ['ljsf; / lzIff','विकास र शिक्षा'], ['d]/f] 3/','मेरो घर'],
    [';+:s[t','संस्कृत'], ['k|]d','प्रेम'], [';To','सत्य'],
  ];
  for (const [source, expected] of examples) assert.equal(convertPreeti(source).text,expected,source);
});

test('short i, reph, half forms, and conjuncts use logical Unicode order', () => {
  const examples = [
    ['ls','कि'], ['lSg','क्नि'], ['lq','त्रि'], ['s{','र्क'], ['ls{','र्कि'],
    ['sd{','कर्म'], ['sfo{','कार्य'], ['sL{','र्की'], ['O{','ई'],
    ['If','क्ष'], ['1fg','ज्ञान'], ['>L','श्री'], ['Sof','क्या'],
    ['s]«','क्रे'], ['6[','ट्ट'], ['b' + '\\' + 'j','द्व'],
  ];
  for (const [source, expected] of examples) assert.equal(convertPreeti(source).text,expected,source);
});

test('extension strokes attach to their syllable including vowels and rakaar', () => {
  const examples = [
    ['km','फ'], ['km"n','फूल'], ['k\'m','फु'], ['k|m','फ्र'],
    ['em','झ'], ['e]m','झे'], ['pm','ऊ'], ['pFm','ऊँ'],
    ['qm','क्र'], ['Qm','क्त'], ['cfk\\mgf]','आफ्नो'],
  ];
  for (const [source, expected] of examples) {
    const result = convertPreeti(source);
    assert.equal(result.text,expected,source);
    assert.deepEqual(result.warnings,[],source);
  }
});

test('vowel pieces, nasal signs, digits, and punctuation preserve meaning', () => {
  const examples = [
    ['cf cf] cf} P]','आ ओ औ ऐ'], ['sf] s]f sf} s}f','को को कौ कौ'],
    ['s+f sFf','कां काँ'], ['!@#$%^&*()','१२३४५६७८९०'],
    ['-g]kfn_=','(नेपाल).'], ['ægd:t]Æ','“नमस्ते”'], ['ç','ॐ'],
  ];
  for (const [source, expected] of examples) assert.equal(convertPreeti(source).text,expected,source);
});

test('existing Unicode and exact whitespace stay outside Preeti reordering', () => {
  const unicode = 'नेपाली कि कार्य र्\u200dय १२३।';
  assert.equal(convertPreeti(unicode).text,unicode);
  assert.equal(convertPreeti('g]kfn\r\n\t  नेपाली\r ls\n').text,'नेपाल\r\n\t  नेपाली\r कि\n');
  assert.equal(convertPreeti('l नेपाली').text,'ि नेपाली');
  assert.equal(convertPreeti('k m').text,'प m');
  assert.equal(convertPreeti('s\n{').text,'क\n{');
  assert.equal(convertPreeti('ls🙂ls').text,'कि🙂कि');
});

test('ambiguous legacy ra is explicit and unsupported input is not discarded', () => {
  assert.equal(convertPreeti('k¥of]').text,'प्रयो');
  assert.equal(convertPreeti('k¥of]','eyelash').text,'पर्\u200dयो');
  assert.equal(convertPreeti('m { ☃').text,'m { ☃');
  assert.ok(convertPreeti('m { ☃').warnings.length >= 2);
  assert.ok(convertPreeti('l').warnings.length);
  assert.equal(convertPreeti('sLL').text,'कीी');
  assert.ok(convertPreeti('sLL').warnings.length);
  assert.deepEqual(convertPreeti(''),{text:'',warnings:[]});
});

test('large input is not truncated and Unicode input is not converted twice', () => {
  const source = 'gd:t]\n'.repeat(10000);
  assert.equal(convertPreeti(source).text,'नमस्ते\n'.repeat(10000));
  const first = convertPreeti('ljsf; sd{').text;
  assert.equal(convertPreeti(first).text,first);
});
