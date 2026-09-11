import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomWord, validateWords } from '../app/tools/word-generator/random-word';

test('published dataset preserves every supplied word exactly', () => {
  const source = JSON.parse(readFileSync('nepali_words_clean.json', 'utf8'));
  const published = validateWords(JSON.parse(readFileSync('public/data/nepali_words_clean.json', 'utf8')));
  assert.deepEqual(published, source);
  assert.equal(published.length, 111865);
  assert.equal(new Set(published).size, published.length);
  for (let index = 0; index < published.length; index++) {
    assert.equal(randomWord(published, () => index), published[index]);
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
