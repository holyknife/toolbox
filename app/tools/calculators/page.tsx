import type { Metadata } from 'next';
import CalculatorsHub from './calculators-hub';

export const metadata: Metadata = {
  title: 'Calculators | Toolbox',
  description:
    'Simple, accurate, and instant calculators for everyday math, finance, currency conversion, health, dates, and GPA.',
};

export default function Page() {
  return (
    <div className="page calculators-hub-page min-h-screen">
      <CalculatorsHub />
    </div>
  );
}
