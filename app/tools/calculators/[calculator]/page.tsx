import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calculator } from 'lucide-react';
import { calculators } from '../calculators-registry';
import CalculatorSearch from '../calculator-search';
import CalculatorWorkspace from '../calculator-workspace';

// Prebuild each registered calculator and return a real 404 for unknown slugs.
export function generateStaticParams() { return calculators.map(item => ({calculator:item.slug})); }
export function generateMetadata({ params }: { params: { calculator: string } }): Metadata {
  const item = calculators.find(item => item.slug === params.calculator);
  return { title:item?.name || 'Calculator not found',description:item?.description };
}
export default function Page({ params }: { params: { calculator: string } }) {
  const item = calculators.find(item => item.slug === params.calculator);
  if (!item) notFound();
  return <div className="page">
    <Link href="/tools/calculators" className="back-link"><ArrowLeft size={14}/>All calculators</Link>
    <div className="tool-heading"><span className="tool-icon"><Calculator size={28}/></span><div><h1>{item.name}</h1><p>{item.description}</p></div></div>
    <CalculatorSearch compact/>
    <CalculatorWorkspace slug={item.slug}/>
  </div>;
}
