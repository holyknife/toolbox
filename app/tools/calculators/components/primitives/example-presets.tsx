'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export interface ExamplePreset<T> {
  label: string;
  description?: string;
  values: T;
}

interface ExamplePresetsProps<T> {
  presets: ExamplePreset<T>[];
  onSelect: (values: T) => void;
  title?: string;
}

export default function ExamplePresets<T>({
  presets,
  onSelect,
  title = 'Quick presets',
}: ExamplePresetsProps<T>) {
  if (!presets || presets.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider">
        <Sparkles size={12} className="text-amber-500" />
        <span>{title}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(preset.values)}
            className="px-2.5 py-1 text-xs rounded-lg bg-card hover:bg-muted border border-border/80 hover:border-border text-text transition-colors text-left"
            title={preset.description}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
