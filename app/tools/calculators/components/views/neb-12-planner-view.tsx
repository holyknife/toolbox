'use client';

import React, { useState, useMemo } from 'react';
import { NEB_CLASS12_STREAMS } from '../../config/neb-class12-subjects';
import { calculateNebGpa, type SubjectEntry } from '../../engines/neb-engine';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import FormulaExplanation from '../primitives/formula-explanation';
import SourceNotice from '../primitives/source-notice';
import { calculators } from '../../registry/calculators-registry';
import { Target, TrendingUp } from 'lucide-react';

export default function Neb12PlannerView() {
  const calculator = calculators.find((c) => c.slug === 'neb-class-12-planner')!;

  const [selectedStream, setSelectedStream] = useState<string>('science');
  const [targetGpa, setTargetGpa] = useState<number>(3.6);

  const streamConfig = useMemo(() => {
    return (
      NEB_CLASS12_STREAMS.find((s) => s.id === selectedStream) ||
      NEB_CLASS12_STREAMS[0]
    );
  }, [selectedStream]);

  const [rows, setRows] = useState(() =>
    streamConfig.subjects.map((sub) => ({
      id: sub.id,
      name: sub.name,
      creditHours: sub.creditHours,
      theoryFull: sub.theoryFullMarks,
      theoryMarks: sub.defaultTheoryMarks ?? 52,
      internalFull: sub.internalFullMarks,
      internalMarks: sub.defaultInternalMarks ?? 22,
    }))
  );

  const handleStreamChange = (streamId: string) => {
    setSelectedStream(streamId);
    const targetStream = NEB_CLASS12_STREAMS.find((s) => s.id === streamId)!;
    setRows(
      targetStream.subjects.map((sub) => ({
        id: sub.id,
        name: sub.name,
        creditHours: sub.creditHours,
        theoryFull: sub.theoryFullMarks,
        theoryMarks: sub.defaultTheoryMarks ?? 52,
        internalFull: sub.internalFullMarks,
        internalMarks: sub.defaultInternalMarks ?? 22,
      }))
    );
  };

  const handleUpdateMarks = (id: string, theory: number, internal: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, theoryMarks: theory, internalMarks: internal } : r
      )
    );
  };

  const subjectEntries: SubjectEntry[] = useMemo(() => {
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      creditHours: r.creditHours,
      theoryMarks: r.theoryMarks,
      theoryFull: r.theoryFull,
      internalMarks: r.internalMarks,
      internalFull: r.internalFull,
    }));
  }, [rows]);

  const result = useMemo(() => calculateNebGpa(subjectEntries), [subjectEntries]);
  const gap = Number((targetGpa - result.gpa).toFixed(2));

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Stream Selector */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              Choose Stream
            </div>
            <div className="flex flex-wrap gap-2">
              {NEB_CLASS12_STREAMS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStreamChange(s.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    selectedStream === s.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-card text-text-dim hover:text-text border-border hover:bg-muted/40'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Target GPA Selector */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-purple-600" />
              <h2 className="text-base font-bold text-text m-0">Set Your Target Class 12 GPA</h2>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={2.0}
                max={4.0}
                step={0.05}
                value={targetGpa}
                onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                className="w-full accent-purple-600"
              />
              <span className="text-lg font-black font-mono text-text w-12 text-right">
                {targetGpa.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Subject sliders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-text m-0">Simulate Theory Marks</h3>
            <div className="space-y-4">
              {rows.map((row) => {
                const subPct = Math.round(
                  ((row.theoryMarks + row.internalMarks) / (row.theoryFull + row.internalFull)) * 100
                );
                return (
                  <div key={row.id} className="p-3 rounded-xl border border-border/70 bg-muted/20">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-semibold text-text">{row.name} ({row.creditHours} CH)</span>
                      <span className="font-mono font-bold text-text">
                        {row.theoryMarks}/{row.theoryFull} theory + {row.internalMarks} int = {subPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-text-dim w-10">Theory</span>
                      <input
                        type="range"
                        min={0}
                        max={row.theoryFull}
                        step={1}
                        value={row.theoryMarks}
                        onChange={(e) =>
                          handleUpdateMarks(row.id, parseInt(e.target.value) || 0, row.internalMarks)
                        }
                        className="w-full accent-purple-600"
                      />
                      <span className="text-xs font-mono font-bold w-7 text-right">
                        {row.theoryMarks}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <FormulaExplanation
            title="How Class 12 Planning Works"
            notes={[
              '5-credit subjects (Math, Physics, Chemistry, Accounting, Economics, Social) impact your GPA more heavily than 3-credit Nepali or 4-credit English.',
              'Prioritize securing at least 35% in high-difficulty subjects to avoid Non-Graded (NG) status.',
            ]}
          />
          <SourceNotice source="National Examinations Board (NEB) Nepal" />
        </div>

        {/* Right Sticky Result */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title="Projected Class 12 GPA"
            primaryValue={result.hasNg ? 'NG' : result.gpa.toFixed(2)}
            primaryUnit="GPA"
            statusBadge={{
              label: gap <= 0 ? 'Target Reached!' : `${gap.toFixed(2)} GPA needed`,
              variant: gap <= 0 ? 'success' : 'warning',
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Current Projected"
                value={result.gpa.toFixed(2)}
                highlight={result.hasNg ? 'danger' : 'accent'}
              />
              <ResultMetric
                label="Target Goal"
                value={targetGpa.toFixed(2)}
              />
              <ResultMetric
                label="Overall Grade"
                value={result.overallGrade}
              />
              <ResultMetric
                label="Gap to Target"
                value={gap <= 0 ? '0.00' : `+${gap.toFixed(2)}`}
                highlight={gap <= 0 ? 'success' : 'warning'}
              />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
