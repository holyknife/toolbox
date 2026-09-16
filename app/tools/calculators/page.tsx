import type { Metadata } from 'next';
import CalculatorsHub from './calculators-hub';

export const metadata: Metadata = {
  title: 'Calculators',
  description: 'Everyday, money, study, health, and date calculators. All calculations stay on your device.',
};

export default function Page() {
  return (
    <div className="page calculators-hub-page">
      <CalculatorsHub />
    </div>
  );
}

