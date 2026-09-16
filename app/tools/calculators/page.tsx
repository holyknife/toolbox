import type { Metadata } from 'next';
import CalculatorsHub from './calculators-hub';

export const metadata: Metadata = {
  title: 'Calculators | Nepal-First Utility Suite',
  description:
    'Clean Nepal-first calculators for SEE & NEB Class 12 GPA, salary tax, land units (Ropani/Bigha), BS/AD dates, gold tola, electricity, and everyday finance.',
};

export default function Page() {
  return (
    <div className="page calculators-hub-page min-h-screen">
      <CalculatorsHub />
    </div>
  );
}
