import type { Metadata } from 'next';
import PreetiConverter from './preeti-converter';

export const metadata: Metadata = {
  title: 'Preeti to Unicode',
  description: 'Convert legacy Preeti Nepali text to Unicode privately in your browser.',
};

// Keep page metadata on the server and text conversion in the client component.
export default function Page() {
  return <PreetiConverter/>;
}
