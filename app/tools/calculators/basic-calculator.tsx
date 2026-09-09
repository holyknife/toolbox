'use client';
import { useRef, useState } from 'react';
import { arithmetic } from './calculate';
import { control, Results } from './calculator-form';

// An editable expression and keypad work together; no code evaluation is used.
export default function BasicCalculator() {
  const [expression,setExpression] = useState('');
  const [answer,setAnswer] = useState<number | null>(null);
  const [error,setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  // Insert at the caret so keypad edits behave like normal keyboard typing.
  function insert(value: string) {
    const start = input.current?.selectionStart ?? expression.length;
    const end = input.current?.selectionEnd ?? expression.length;
    const position = value === '⌫' ? Math.max(0,start - (start === end ? 1 : 0)) : start;
    const next = value === '⌫' ? '' : value;
    const updated = expression.slice(0,position) + next + expression.slice(end);
    if (updated.length > 2000) { setError('Keep this expression under 2,000 characters.'); return; }
    setExpression(updated);
    setAnswer(null); setError('');
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(position + next.length,position + next.length); });
  }
  // Keep parse and arithmetic errors readable, including excessively nested expressions.
  function calculate() {
    try { setAnswer(arithmetic(expression)); setError(''); }
    catch (error) { setAnswer(null); setError(error instanceof RangeError ? 'This calculation is too deeply nested. Simplify it and try again.' : error instanceof Error ? error.message : 'Check this calculation.'); }
  }
  return <div className="max-w-lg">
    <label className="text-sm text-text">Expression<input ref={input} className={control} value={expression} placeholder="(120 + 80) × 10%" maxLength={2000}
      onChange={event => { setExpression(event.target.value); setAnswer(null); setError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); calculate(); } }}/></label>
    <div className="mt-4 grid grid-cols-4 gap-2">{['AC','(',')','⌫','7','8','9','÷','4','5','6','×','1','2','3','−','0','.','%','+'].map(key => <button key={key} className="rounded-panel border border-border bg-bg py-3 text-lg text-text" aria-label={key === '⌫' ? 'Backspace' : key === 'AC' ? 'Clear expression' : key}
      onMouseDown={event => event.preventDefault()} onClick={() => { if (key === 'AC') { setExpression(''); setAnswer(null); setError(''); input.current?.focus(); } else insert(key === '−' ? '-' : key); }}>{key}</button>)}</div>
    <button className="primary-button mt-3 w-full" onClick={calculate}>= Calculate</button>
    {error && <p role="alert" className="mt-3 text-sm text-text">{error}</p>}
    <Results results={answer === null ? [] : [{label:'Answer',value:Number(answer.toPrecision(12)).toString()}]}/>
  </div>;
}
