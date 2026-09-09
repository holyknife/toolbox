import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calculator } from 'lucide-react';
import CalculatorSearch from './calculator-search';
import CalculatorWorkspace from './calculator-workspace';
export const metadata: Metadata = { title:'Calculators',description:'Everyday, money, study, health, and date calculators. All calculations stay on your device.' };

// Start with the simplest calculator, followed by the searchable specialist collection.
export default function Page() {
  return <div className="page">
    <Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link>
    <div className="tool-heading"><span className="tool-icon"><Calculator size={28}/></span><div><h1>Calculators</h1><p>Small questions. Clear answers.</p></div></div>
    <CalculatorWorkspace slug="basic"/>
    <CalculatorSearch/>
  </div>;
}
