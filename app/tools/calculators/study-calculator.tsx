'use client';
import { useState } from 'react';
import { finalGrade, numberInput, requiredGrade, weightedAverage } from './calculate';
import { control, Results } from './calculator-form';
import type { Result } from './calculators-registry';

// Course rows use explicit numeric points, avoiding assumptions about letter-grade systems.
export default function StudyCalculator({ gpa }: { gpa: boolean }) {
  const [mode,setMode] = useState('Weighted grade');
  const [scale,setScale] = useState('4');
  const [rows,setRows] = useState([{score:gpa ? '4' : '80',weight:gpa ? '3' : '40'},{score:gpa ? '3' : '90',weight:gpa ? '3' : '60'}]);
  const [current,setCurrent] = useState('80');
  const [target,setTarget] = useState('85');
  const [weight,setWeight] = useState('40');
  const [marks,setMarks] = useState('100');
  const [results,setResults] = useState<Result[]>([]);
  const [error,setError] = useState('');
  // Results are cleared on any edit so old answers never describe new inputs.
  function clearResult() { setResults([]); setError(''); }
  function calculate() {
    try {
      if (gpa || mode === 'Weighted grade') {
        const maximum = gpa ? numberInput(scale,'GPA scale',0.1,100) : 100;
        const values = rows.map(row => ({score:numberInput(row.score,'Score',0,maximum),weight:numberInput(row.weight,'Weight',0.00001,10000)}));
        const result = weightedAverage(values,maximum);
        if (!gpa && result.weight > 100 + 1e-8) throw new Error('Assessment weights cannot total more than 100%.');
        setResults([{label:gpa ? 'GPA' : 'Weighted average (%)',value:result.value},{label:gpa ? 'Total credits' : 'Total weight (%)',value:result.weight},
          ...(gpa ? [{label:'Scale',value:maximum}] : [{label:'Course percentage points earned',value:result.value * result.weight / 100}])]);
      } else {
        const coursework = numberInput(current,'Current grade',0,100);
        const goal = numberInput(target,mode === 'Required marks' ? 'Target grade' : 'Exam score',0,100);
        const examWeight = numberInput(weight,'Exam weight',0.00001,100);
        if (mode === 'Final grade') setResults([{label:'Final grade (%)',value:finalGrade(coursework,goal,examWeight)}]);
        else {
          const examTotal = numberInput(marks,'Total exam marks',1,1000000);
          const needed = requiredGrade(coursework,goal,examWeight);
          setResults([{label:'Required exam score (%)',value:Math.max(0,needed)},{label:'Whole marks required',value:Math.max(0,Math.ceil(needed * examTotal / 100 - 1e-10))},{label:'Status',value:needed > 100 ? 'Not attainable with this exam weight' : needed <= 0 ? 'Target already met, even with 0 on the exam' : 'Attainable'}]);
        }
      }
      setError('');
    } catch (error) { setResults([]); setError(error instanceof Error ? error.message : 'Check the grades and weights.'); }
  }
  return <form onSubmit={event => { event.preventDefault(); calculate(); }} onChange={clearResult}>
    {!gpa && <label className="block text-sm text-text">Calculation<select className={control} value={mode} onChange={event => { setMode(event.target.value); clearResult(); }}>{['Weighted grade','Required marks','Final grade'].map(value => <option key={value}>{value}</option>)}</select></label>}
    {gpa && <label className="block text-sm text-text">Maximum GPA scale<input required className={control} type="number" min="0.1" max="100" step="any" value={scale} onChange={event => setScale(event.target.value)}/></label>}
    {gpa || mode === 'Weighted grade' ? <div className="mt-5 space-y-4">
      {rows.map((row,index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
        <label className="text-sm text-text">{gpa ? 'Grade points' : 'Score (%)'} {index + 1}<input required className={control} type="number" min="0" step="any" value={row.score} onChange={event => setRows(rows.map((item,position) => position === index ? {...item,score:event.target.value} : item))}/></label>
        <label className="text-sm text-text">{gpa ? 'Credits' : 'Weight (%)'} {index + 1}<input required className={control} type="number" min="0.00001" step="any" value={row.weight} onChange={event => setRows(rows.map((item,position) => position === index ? {...item,weight:event.target.value} : item))}/></label>
        <button type="button" disabled={rows.length === 1} aria-label={`Remove row ${index + 1}`} className="mb-3 text-sm text-dim" onClick={() => { setRows(rows.filter((_,position) => position !== index)); clearResult(); }}>×</button>
      </div>)}
      <button type="button" className="text-sm text-accent" onClick={() => { setRows([...rows,{score:'',weight:''}]); clearResult(); }}>+ Add {gpa ? 'course' : 'assessment'}</button>
      {!gpa && <p className="text-xs text-dim">Weights below 100% show the average of completed work, plus its contribution to the full course.</p>}
    </div> : <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-text">Current coursework grade (%)<input required type="number" min="0" max="100" step="any" className={control} value={current} onChange={event => setCurrent(event.target.value)}/></label>
      <label className="text-sm text-text">{mode === 'Required marks' ? 'Target overall grade (%)' : 'Final exam score (%)'}<input required type="number" min="0" max="100" step="any" className={control} value={target} onChange={event => setTarget(event.target.value)}/></label>
      <label className="text-sm text-text">Final exam weight (%)<input required type="number" min="0.00001" max="100" step="any" className={control} value={weight} onChange={event => setWeight(event.target.value)}/></label>
      {mode === 'Required marks' && <label className="text-sm text-text">Total exam marks<input required type="number" min="1" step="1" className={control} value={marks} onChange={event => setMarks(event.target.value)}/></label>}
    </div>}
    <button className="primary-button mt-6">Calculate</button>
    {error && <p role="alert" className="mt-3 text-sm text-text">{error}</p>}
    <Results results={results}/>
  </form>;
}
