'use client';

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface SourceNoticeProps {
  source: string;
  updateDate?: string;
  note?: string;
}

export default function SourceNotice({ source, updateDate, note }: SourceNoticeProps) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/70 text-[11px] text-text-dim">
      <ShieldCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-text">
          Source: {source}
        </div>
        {note && <div className="mt-0.5 text-text-dim/90">{note}</div>}
        {updateDate && (
          <div className="mt-1 text-[10px] text-text-dim/60">
            Rules verified: {updateDate}
          </div>
        )}
      </div>
    </div>
  );
}
