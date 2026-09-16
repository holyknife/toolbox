import type { Metadata } from 'next';
import NepalHub from './nepal-hub';

export const metadata: Metadata = {
  title: 'Nepal Calculators | Toolbox',
  description:
    'Dedicated Nepal utility suite: SEE & Class 12 NEB GPA calculators, CDC Letter Grading 2078 rules, 2081/82 salary tax slabs, Bikram Sambat dates, and Ropani/Bigha land measurement.',
  keywords: [
    'nepal calculators',
    'see gpa calculator 2081',
    'neb class 12 gpa',
    'nepal salary tax 2081 2082',
    'nepal land converter ropani bigha',
    'bs ad age converter',
    'nea electricity bill calculator',
  ],
};

export default function NepalCalculatorsPage() {
  return (
    <div className="page calculators-nepal-hub-page">
      <NepalHub />
    </div>
  );
}
