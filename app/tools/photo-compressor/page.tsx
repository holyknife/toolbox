import type { Metadata } from 'next';
import PhotoCompressor from './photo-compressor';

export const metadata: Metadata = {
  title: 'Photo Compressor',
  description: 'Compress images to a target size, privately in your browser.',
};

// Keep metadata on the server while the client component owns browser work.
export default function Page() {
  return <PhotoCompressor/>;
}
