'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FormulaExplanationProps {
  title?: string;
  formula?: string;
  notes?: string[];
  defaultOpen?: boolean;
}

export default function FormulaExplanation({
  title = 'How this is calculated',
  formula,
  notes = [],
  defaultOpen = false,
}: FormulaExplanationProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border/70 bg-card/40 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 text-left font-semibold text-text hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <HelpCircle size={15} className="text-text-dim" />
          <span>{title}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-text-dim transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="p-3.5 pt-1 border-t border-border/50 text-text-dim space-y-2.5">
          {formula && (
            <div className="p-2.5 rounded-lg bg-muted/60 font-mono text-[11px] text-text">
              {formula}
            </div>
          )}
          {notes.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed pl-1">
              {notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
