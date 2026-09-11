import type { Metadata } from 'next';
import WordGenerator from './word-generator';

export const metadata: Metadata = {
  title: 'Word Generator',
  description: 'Generate random English and Nepali words from independent word collections.',
};

// Keep metadata on the server while language selection runs in the browser.
export default function Page() {
  return <WordGenerator/>;
}
