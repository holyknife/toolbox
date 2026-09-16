'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateTripFuel,
  calculateBmi,
  calculateAspectRatio,
} from '../../engines/everyday-engine';
import { tip as calcTip, discount as calcDiscount } from '../../calculate';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField, { SelectField } from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators, getCalculatorBySlug } from '../../registry/calculators-registry';

// 1. FUEL COST VIEW
export function FuelCostView() {
  const calculator = getCalculatorBySlug('trip-fuel-cost')!;
  const [distance, setDistance] = useState(200); // e.g. Kathmandu to Pokhara ~200km
  const [mileage, setMileage] = useState(15); // 15 km/L
  const [price, setPrice] = useState(175); // NPR 175/L petrol
  const [passengers, setPassengers] = useState(4);
  const [roundTrip, setRoundTrip] = useState(false);

  const result = useMemo(() => {
    return calculateTripFuel(distance, mileage, price, passengers, roundTrip);
  }, [distance, mileage, price, passengers, roundTrip]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="One-way Distance (km)" type="number" value={distance} onChange={setDistance} min={1} unit="km" />
              <InputField label="Vehicle Mileage (km/Litre)" type="number" value={mileage} onChange={setMileage} min={1} step={0.5} unit="km/L" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Fuel Price (NPR per Litre)" type="number" value={price} onChange={setPrice} min={1} unit="NPR" subtext="Nepal Oil Corporation retail tariff" />
              <InputField label="Number of Passengers" type="number" value={passengers} onChange={setPassengers} min={1} max={50} unit="people" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="rt" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} className="w-4 h-4 rounded border-border accent-blue-600 cursor-pointer" />
              <label htmlFor="rt" className="text-xs text-text font-medium cursor-pointer select-none">Include return journey (Round Trip)</label>
            </div>
          </div>
          <FormulaExplanation title="Fuel Cost Formula" notes={['Fuel Litres = Total Distance (km) ÷ Vehicle Mileage (km/L)', 'Total Fuel Cost = Fuel Litres × Price per Litre', 'Cost per Passenger = Total Fuel Cost ÷ Passenger Count']} />
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Total Fuel Cost"
            primaryValue={`Rs ${result.totalCost.toLocaleString()}`}
            primaryUnit="Total"
            statusBadge={{ label: `Rs ${result.costPerPassenger.toLocaleString()} / person`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Fuel Needed" value={`${result.fuelRequiredLitres}`} unit="Litres" highlight="accent" />
              <ResultMetric label="Per Person Cost" value={`Rs ${result.costPerPassenger.toLocaleString()}`} highlight="success" />
              <ResultMetric label="Total Distance" value={`${result.effectiveDistance}`} unit="km" />
              <ResultMetric label="Passengers" value={passengers} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 2. TIP CALCULATOR VIEW
export function TipView() {
  const calculator = calculators.find((c) => c.slug === 'tip')!;
  const [bill, setBill] = useState(2500);
  const [tipRate, setTipRate] = useState(10);
  const [people, setPeople] = useState(4);

  const result = useMemo(() => {
    return calcTip(bill, tipRate, people);
  }, [bill, tipRate, people]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <InputField label="Total Bill Amount (NPR)" type="number" value={bill} onChange={setBill} min={0} unit="NPR" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Tip Percentage (%)" type="number" value={tipRate} onChange={setTipRate} min={0} max={100} unit="%" />
              <InputField label="Split Between (People)" type="number" value={people} onChange={setPeople} min={1} max={100} unit="people" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Per Person Share"
            primaryValue={`Rs ${result.each.toLocaleString()}`}
            primaryUnit="/ person"
            statusBadge={{ label: `Rs ${result.total.toLocaleString()} Total`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Total Bill" value={`Rs ${result.total.toLocaleString()}`} highlight="accent" />
              <ResultMetric label="Tip Amount" value={`Rs ${result.tip.toLocaleString()}`} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 3. BMI CALCULATOR VIEW
export function BmiView() {
  const calculator = calculators.find((c) => c.slug === 'bmi')!;
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState(68); // kg
  const [height, setHeight] = useState(172); // cm

  const result = useMemo(() => {
    const wKg = unit === 'metric' ? weight : weight * 0.453592;
    const hM = unit === 'metric' ? height / 100 : height * 0.0254;
    return calculateBmi(wKg, hM);
  }, [unit, weight, height]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex gap-2 p-1.5 rounded-xl bg-muted/40 border border-border">
            <button type="button" onClick={() => setUnit('metric')} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${unit === 'metric' ? 'bg-card text-text shadow-xs' : 'text-text-dim'}`}>Metric (kg / cm)</button>
            <button type="button" onClick={() => setUnit('imperial')} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${unit === 'imperial' ? 'bg-card text-text shadow-xs' : 'text-text-dim'}`}>Imperial (lb / inches)</button>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label={unit === 'metric' ? 'Weight (kg)' : 'Weight (lbs)'} type="number" value={weight} onChange={setWeight} min={1} />
              <InputField label={unit === 'metric' ? 'Height (cm)' : 'Height (inches)'} type="number" value={height} onChange={setHeight} min={1} />
            </div>
          </div>
          <FormulaExplanation title="WHO Body Mass Index Classification" notes={['Underweight: < 18.5', 'Normal weight: 18.5 – 24.9', 'Overweight: 25.0 – 29.9', 'Obesity: ≥ 30.0']} />
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Body Mass Index"
            primaryValue={result.bmi.toFixed(1)}
            primaryUnit="BMI"
            statusBadge={{
              label: result.category,
              variant: result.category === 'Normal weight' ? 'success' : result.category.includes('Obese') ? 'danger' : 'warning',
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="Category" value={result.category} highlight={result.category === 'Normal weight' ? 'success' : 'warning'} />
              <ResultMetric label="Healthy Range" value="18.5 – 24.9" />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 4. ASPECT RATIO VIEW
export function AspectRatioView() {
  const calculator = calculators.find((c) => c.slug === 'aspect-ratio')!;
  const [w, setW] = useState(1920);
  const [h, setH] = useState(1080);
  const [targetDim, setTargetDim] = useState(1280);
  const [mode, setMode] = useState<'width' | 'height'>('width');

  const result = useMemo(() => {
    return mode === 'width'
      ? calculateAspectRatio(w, h, targetDim, undefined)
      : calculateAspectRatio(w, h, undefined, targetDim);
  }, [w, h, targetDim, mode]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text m-0">Original Dimensions</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Original Width (px)" type="number" value={w} onChange={setW} min={1} unit="px" />
              <InputField label="Original Height (px)" type="number" value={h} onChange={setH} min={1} unit="px" />
            </div>
            <div className="border-t border-border/60 pt-4 grid grid-cols-2 gap-4">
              <SelectField label="Resize By" value={mode} onChange={(v) => setMode(v as any)} options={[{ label: 'Target Width', value: 'width' }, { label: 'Target Height', value: 'height' }]} />
              <InputField label="Target Dimension (px)" type="number" value={targetDim} onChange={setTargetDim} min={1} unit="px" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Reduced Aspect Ratio"
            primaryValue={result.ratio}
            primaryUnit=""
            statusBadge={{ label: `${result.width} × ${result.height} px`, variant: 'success' }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric label="New Width" value={`${result.width} px`} highlight="accent" />
              <ResultMetric label="New Height" value={`${result.height} px`} highlight="accent" />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}

// 5. BASIC KEYPAD VIEW
export function BasicKeypadView() {
  const calculator = calculators.find((c) => c.slug === 'basic')!;
  const [expr, setExpr] = useState('0');

  const handleKey = (k: string) => {
    if (k === 'C') setExpr('0');
    else if (k === '⌫') setExpr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    else if (k === '=') {
      try {
        const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
        // Simple evaluation using Function
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${sanitized})`)();
        setExpr(String(res));
      } catch {
        setExpr('Error');
      }
    } else {
      setExpr((prev) => (prev === '0' || prev === 'Error' ? k : prev + k));
    }
  };

  const keys = ['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='];

  return (
    <div className="w-full max-w-xl mx-auto">
      <CalculatorHeader calculator={calculator} />
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
        <div className="p-4 rounded-xl bg-muted/60 text-right font-mono text-3xl font-black text-text truncate">
          {expr}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKey(k)}
              className={`p-3.5 text-base font-bold rounded-xl border transition-all active:scale-95 ${
                k === '='
                  ? 'bg-blue-600 text-white border-blue-600 col-span-1 shadow-xs'
                  : ['÷', '×', '-', '+'].includes(k)
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/60'
                  : 'bg-card text-text border-border hover:bg-muted/40'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
