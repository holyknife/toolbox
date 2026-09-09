import type { Metadata } from 'next';
import DateConverter from './date-converter';

export const metadata: Metadata = {
  title: 'BS ↔ AD Date Converter',
  description: 'Convert Nepali Bikram Sambat and Gregorian dates with simple wheel pickers.',
};

// The route owns metadata; browser interactions live in the client component.
export default function Page() {
  return <DateConverter/>;
}
