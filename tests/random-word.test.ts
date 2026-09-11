import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomWord, validateWords } from '../app/tools/word-generator/random-word';

test('both complete datasets contain unique words and every entry is reachable', () => {
  for (const [language, count] of [['nepali', 111865], ['english', 274013]] as const) {
    const words = validateWords(JSON.parse(readFileSync(`public/data/${language}_words_clean.json`, 'utf8')));
    assert.equal(words.length, count);
    assert.equal(new Set(words).size, count);
    for (let index = 0; index < words.length; index++) {
      assert.equal(randomWord(words, () => index), words[index]);
    }
  }
});

test('selection rejects biased tail, allows repeats, and reaches both ends', () => {
  const words = ['पहिलो', 'दोस्रो', 'तेस्रो'];
  const draws = [4294967295, 2];
  assert.equal(randomWord(words, () => draws.shift()!), 'तेस्रो');
  assert.equal(draws.length, 0);
  assert.equal(randomWord(words, () => 0), 'पहिलो');
  assert.equal(randomWord(words, () => 0), 'पहिलो');
  assert.ok(words.includes(randomWord(words)));
});

test('invalid data fails clearly instead of silently dropping entries', () => {
  for (const invalid of [null, [], [''], ['valid', 3], {}]) {
    assert.throws(() => validateWords(invalid), /word list/);
  }
  assert.throws(() => randomWord([]), /valid word list/);
});
