import type { Metadata } from 'next';
import NepaliTyping from './nepali-typing';

export const metadata: Metadata = {
  title: 'Nepali Typing',
  description: 'Type Romanized Nepali, choose Devanagari suggestions, and save your writing privately on your device.',
};

// Keep metadata on the server and the interactive editor in its own client component.
export default function Page() {
  return <NepaliTyping/>;
}
