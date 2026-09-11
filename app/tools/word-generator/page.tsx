import type { Metadata } from 'next';
import WordGenerator from './word-generator';

export const metadata: Metadata = {
  title: 'Word Generator',
  description: 'Discover a random Nepali word from a collection of over 111,000 words.',
};

// Keep metadata on the server while language selection runs in the browser.
export default function Page() {
  return <WordGenerator/>;
}
