'use client';
import { useState } from 'react';
import { control, Results } from './calculator-form';
import { solveTax, type TaxCalculation, type TaxField, type TaxFields } from './tax';

const labels: Record<TaxField,string> = { rate:'Tax rate (%)',before:'Price before tax',after:'Price after tax' };
const defaultValues: TaxFields = { rate:'13',before:'',after:'' };

// The calculated field stays identifiable, so changing an input never leaves a stale bill.
export default function TaxCalculator() {
  const [values,setValues] = useState<TaxFields>(defaultValues);
  const [generated,setGenerated] = useState<TaxField | null>(null);
  const [result,setResult] = useState<TaxCalculation | null>(null);
  const [error,setError] = useState('');

  // Keep both user inputs and clear the derived value when either input changes.
  function changeField(key: TaxField, value: string) {
    const next = { ...values };
    if (generated && generated !== key && value.trim() !== '') next[generated] = '';
    next[key] = value;
    setValues(next); setGenerated(null); setResult(null); setError('');
  }

  // Reuse original inputs on repeated calculation instead of compounding display rounding.
  function calculate() {
    try {
      const inputs = generated ? { ...values,[generated]:'' } : values;
      const next = solveTax(inputs);
      if (next.filled) {
        const displayed = next.filled === 'rate' ? String(Number(next.rate.toPrecision(12))) : next[next.filled].toFixed(2);
        setValues({ ...inputs,[next.filled]:displayed });
      }
      setGenerated(next.filled); setResult(next); setError('');
    } catch (error) {
      setResult(null);
      setError(error instanceof Error ? error.message : 'Check the entered amounts and try again.');
    }
  }

  // Start a new bill with blank prices and the editable default tax rate.
  function reset() { setValues(defaultValues); setGenerated(null); setResult(null); setError(''); }

  return <form onSubmit={event => { event.preventDefault(); calculate(); }}>
    <p id="tax-help" className="mb-5 text-sm text-dim">Enter any two values and leave the third blank. Calculate fills it in for you.</p>
    <div className="grid gap-5 sm:grid-cols-3">{(Object.keys(labels) as TaxField[]).map(key => <div key={key}>
      <label className="block text-sm font-medium text-text" htmlFor={`tax-${key}`}>{labels[key]}</label>
      <input id={`tax-${key}`} type="number" min="0" step="any" max={key === 'rate' ? 1000000 : 1e15} value={values[key]} aria-describedby="tax-help"
        placeholder={key === 'rate' ? 'e.g. 13' : key === 'before' ? 'e.g. 1000' : 'e.g. 1130'}
        className={control} onChange={event => changeField(key,event.target.value)}/>
      <div className="mt-2 flex min-h-5 justify-between gap-2 text-xs">
        <span className="text-accent">{generated === key ? 'Automatically calculated' : ''}</span>
        {values[key] && <button type="button" className="text-dim underline" aria-label={`Clear ${labels[key]}`} onClick={() => changeField(key,'')}>Clear</button>}
      </div>
    </div>)}</div>
    <div className="mt-5 flex flex-wrap gap-3"><button type="submit" className="primary-button">Calculate</button><button type="button" className="rounded-panel border border-border px-4 py-2 text-sm text-dim" onClick={reset}>New bill</button></div>
    {error && <p role="alert" className="mt-4 text-sm text-text">{error}</p>}
    {result && <><p role="status" className="mt-4 text-sm text-dim">{generated ? `${labels[generated]} filled in.` : 'All three values match.'}</p><Results results={[
      {label:'Price before tax',value:result.before},
      {label:'Tax amount',value:result.tax},
      {label:'Price after tax',value:result.after},
      {label:'Tax rate',value:result.rate,suffix:'%'},
    ]}/></>}
  </form>;
}
