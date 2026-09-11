// Validate the complete file without filtering or changing any supplied spelling.
export function validateWords(data: unknown): string[] {
  if (!Array.isArray(data) || !data.length || data.some(word => typeof word !== 'string' || !word.trim())) {
    throw new Error('The word list could not be read. Please try loading it again.');
  }
  return data;
}

// Use browser-provided cryptographic randomness instead of a predictable sequence.
function randomUint32(): number {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Random generation is unavailable in this browser. Please try a current browser.');
  }
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}

// Reject the uneven tail of the 32-bit range so modulo gives every index equal odds.
// Independent draws intentionally allow repeats; no words are skipped or weighted.
export function randomWord(words: readonly string[], draw: () => number = randomUint32): string {
  const range = 2 ** 32;
  if (!words.length || words.length > range) throw new Error('Please load a valid word list first.');
  const limit = range - (range % words.length);
  let randomValue = draw();
  while (randomValue >= limit) randomValue = draw();
  return words[randomValue % words.length];
}
