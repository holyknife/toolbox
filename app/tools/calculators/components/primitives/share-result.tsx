'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface ShareResultProps {
  text?: string;
  title?: string;
  summaryText?: string;
}

export default function ShareResult({ text, title, summaryText }: ShareResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const content = text || (title && summaryText ? `${title}\n${summaryText}` : summaryText || title || '');
      const fullText = `${content}\nCalculated with Toolbox (tools.abhiyankhatiwada.com.np/tools/calculators)`.trim();
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/70 hover:bg-muted text-text border border-border transition-colors"
      title="Copy summary to clipboard"
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-500" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} className="text-text-dim" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
