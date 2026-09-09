'use client';
import { useEffect, useState } from 'react';
import { calculators } from './calculators-registry';
import CalculatorForm from './calculator-form';
import BasicCalculator from './basic-calculator';
import TaxCalculator from './tax-calculator';
import StudyCalculator from './study-calculator';

// Resolve the registry in the browser; functions never cross a server/client boundary.
export default function CalculatorWorkspace({ slug }: { slug: string }) {
  const [ready,setReady] = useState(false);
  // Prevent a click before the browser has connected the form's event handlers.
  useEffect(() => setReady(true),[]);
  const calculator = calculators.find(item => item.slug === slug)!;
  return <section className="rounded-panel border border-border bg-panel p-5 sm:p-7">
    <h2 className="mb-5 text-xl font-semibold text-text">{calculator.name}</h2>
    <fieldset disabled={!ready} className="min-w-0">
    {slug === 'basic' ? <BasicCalculator/> : slug === 'tax' ? <TaxCalculator/> : slug === 'gpa' || slug === 'grade' ? <StudyCalculator key={slug} gpa={slug === 'gpa'}/> : <CalculatorForm key={slug} calculator={calculator}/>}
    </fieldset>
    <p className="mt-6 border-t border-border pt-4 text-sm leading-relaxed text-dim">{calculator.note}</p>
    {calculator.category === 'Money' && <p className="mt-2 text-xs text-dim">Estimates only. Use consistent currency units; displayed amounts round to two decimals.</p>}
    {slug === 'bmi' && <a href="https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html" className="mt-2 inline-block text-xs text-accent underline">CDC adult BMI reference</a>}
  </section>;
}
