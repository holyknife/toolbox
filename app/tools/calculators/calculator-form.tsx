'use client';
import { useEffect, useState } from 'react';
import { today } from './dates';
import type { Calculator, Result } from './calculators-registry';
export const control = 'mt-2 w-full rounded-panel border border-border bg-bg px-3 py-3 text-text outline-none focus:border-accent';

// Display consistent precision while retaining full precision inside all formulas.
export function Results({ results }: { results: Result[] }) {
  return <dl aria-live="polite" className="mt-6 grid gap-3 sm:grid-cols-2">{results.map(result => <div key={result.label} className="rounded-panel border border-border bg-bg p-4"><dt className="text-sm text-dim">{result.label}</dt><dd className="mt-2 break-words text-xl font-semibold text-text">{typeof result.value === 'number' ? result.value.toLocaleString(undefined,{maximumFractionDigits:2}) : result.value}{result.suffix && ' ' + result.suffix}</dd></div>)}</dl>;
}

// Small calculators share form rendering; their formulas remain isolated and testable.
export default function CalculatorForm({ calculator }: { calculator: Calculator }) {
  const initial = Object.fromEntries((calculator.fields || []).map(field => [field.key,field.value === 'today' ? '' : field.value]));
  const [values,setValues] = useState<Record<string,string>>(initial);
  const [results,setResults] = useState<Result[]>([]);
  const [error,setError] = useState('');
  useEffect(() => { setValues(previous => ({ ...previous,...Object.fromEntries((calculator.fields || []).filter(field => field.value === 'today').map(field => [field.key,today()])) })); },[calculator]);
  // Unit switching preserves the entered measurement instead of reinterpreting it.
  function changeField(key: string, value: string) {
    const next = { ...values,[key]:value };
    if (calculator.slug === 'bmi' && key === 'units' && value !== values.units) {
      const imperial = value.startsWith('Imperial');
      if (values.weight.trim()) next.weight = String(Number((Number(values.weight) * (imperial ? 1 / 0.45359237 : 0.45359237)).toFixed(4)));
      if (values.height.trim()) next.height = String(Number((Number(values.height) * (imperial ? 1 / 2.54 : 2.54)).toFixed(4)));
    }
    setValues(next); setResults([]); setError('');
  }
  return <form onSubmit={event => {
    event.preventDefault();
    try { setResults(calculator.calculate!(values)); setError(''); }
    catch (error) { setResults([]); setError(error instanceof Error ? error.message : 'Check your inputs and try again.'); }
  }}>
    <div className="grid gap-5 sm:grid-cols-2">{calculator.fields?.map(field => <label key={field.key} className="block text-sm font-medium text-text">{calculator.slug === 'bmi' && field.key === 'weight' ? (values.units.startsWith('Imperial') ? 'Weight (lb)' : 'Weight (kg)') : calculator.slug === 'bmi' && field.key === 'height' ? (values.units.startsWith('Imperial') ? 'Height (total inches)' : 'Height (cm)') : field.label}
      {field.type === 'select' ? <select className={control} value={values[field.key]} onChange={event => changeField(field.key,event.target.value)}>{field.options?.map(option => <option key={option}>{option}</option>)}</select> :
      <input className={control} type={field.type === 'date' ? 'date' : 'number'} step="any" min={field.type === 'date' ? '0001-01-01' : field.min ?? 0} max={field.type === 'date' ? '9999-12-31' : field.max ?? 1e15} required value={values[field.key]} onChange={event => changeField(field.key,event.target.value)}/>}
    </label>)}</div>
    <button className="primary-button mt-6" type="submit">Calculate</button>
    {error && <p role="alert" className="mt-4 text-sm text-text">{error}</p>}
    <Results results={results}/>
  </form>;
}
