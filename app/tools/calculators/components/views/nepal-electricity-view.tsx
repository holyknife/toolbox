'use client';

import React, { useState, useMemo } from 'react';
import { calculateNeaBill } from '../../engines/everyday-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField, { SelectField } from '../primitives/input-section';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import ExamplePresets from '../primitives/example-presets';
import { getCalculatorBySlug } from '../../registry/calculators-registry';

export default function NepalElectricityView() {
  const calculator = getCalculatorBySlug('nepal-electricity-bill')!;

  const [capacity, setCapacity] = useState<'5A' | '15A' | '30A' | '60A'>('5A');
  const [units, setUnits] = useState(85);

  const result = useMemo(() => {
    return calculateNeaBill(Number(units) || 0, capacity);
  }, [capacity, units]);

  const presets = [
    { label: 'Lifeline (15 Units, 5A)', values: () => { setCapacity('5A'); setUnits(15); } },
    { label: 'Typical Family (85 Units, 5A)', values: () => { setCapacity('5A'); setUnits(85); } },
    { label: 'AC / Heavy (250 Units, 15A)', values: () => { setCapacity('15A'); setUnits(250); } },
    { label: 'Large Household (450 Units, 30A)', values: () => { setCapacity('30A'); setUnits(450); } },
  ];

  const columns: Column<any>[] = [
    { header: 'Slab Range', accessor: 'slab' },
    { header: 'Units Billed', accessor: 'units', align: 'center' },
    { header: 'Rate (Rs)', accessor: (r) => `Rs ${r.rate}`, align: 'right' },
    { header: 'Cost (Rs)', accessor: (r) => `Rs ${(r.cost ?? 0).toLocaleString()}`, align: 'right' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-text m-0">Meter & Consumption</h2>
              <ExamplePresets
                presets={presets.map((p) => ({ label: p.label, values: p.values }))}
                onSelect={(fn) => fn()}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Meter Capacity (Amperage)"
                value={capacity}
                onChange={(v) => setCapacity(v as any)}
                options={[
                  { label: '5 Ampere (Standard Domestic)', value: '5A' },
                  { label: '15 Ampere (Moderate Domestic)', value: '15A' },
                  { label: '30 Ampere (High Domestic)', value: '30A' },
                  { label: '60 Ampere (Heavy Domestic)', value: '60A' },
                ]}
              />
              <InputField
                label="Units Consumed (kWh)"
                type="number"
                value={units}
                onChange={setUnits}
                min={0}
                unit="units"
              />
            </div>
          </div>

          <FormulaExplanation
            title="NEA Domestic Tariff Slabs"
            notes={[
              '0–20 Units (5A Lifeline): Minimum charge Rs 30, energy charge free for 5A consumers.',
              '21–30 Units: Energy charge Rs 6.50/unit + Rs 50 minimum.',
              '31–50 Units: Energy charge Rs 8.00/unit + Rs 75 minimum.',
              '51–100 Units: Energy charge Rs 9.50/unit + Rs 100 minimum.',
              '101–250 Units: Energy charge Rs 10.00/unit.',
              'Above 250 Units: Energy charge Rs 11.00/unit.',
            ]}
          />
          <SourceNotice source="Nepal Electricity Authority (NEA) Tariff Determination Commission" />
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Estimated NEA Bill"
            primaryValue={`Rs ${result.totalBill.toLocaleString()}`}
            primaryUnit="Total"
            statusBadge={{
              label: `${capacity} • ${units} Units`,
              variant: 'success',
            }}
            shareSummary={`NEA Electricity Bill: ${units} Units (${capacity}) = Rs ${result.totalBill.toLocaleString()} (Energy: Rs ${result.energyCharge}, Minimum: Rs ${result.minimumCharge})`}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Energy Charge"
                value={`Rs ${result.energyCharge.toLocaleString()}`}
                highlight="accent"
              />
              <ResultMetric
                label="Minimum Charge"
                value={`Rs ${result.minimumCharge.toLocaleString()}`}
              />
              <ResultMetric
                label="Average Cost/Unit"
                value={units > 0 ? `Rs ${(result.totalBill / units).toFixed(2)}` : 'N/A'}
              />
              <ResultMetric
                label="Meter Capacity"
                value={capacity}
              />
            </div>

            <div className="mt-5 space-y-2">
              <div className="text-xs font-semibold text-text">Slab Breakdown</div>
              <BreakdownTable columns={columns} data={result.breakdown} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
