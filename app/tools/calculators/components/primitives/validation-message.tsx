'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface ValidationMessageProps {
  type?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
}

export default function ValidationMessage({
  type = 'warning',
  title,
  message,
}: ValidationMessageProps) {
  const styles = {
    error: {
      box: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300',
      icon: <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />,
    },
    warning: {
      box: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300',
      icon: <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
    },
    info: {
      box: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300',
      icon: <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
    },
    success: {
      box: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300',
      icon: <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
    },
  }[type];

  return (
    <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${styles.box}`}>
      {styles.icon}
      <div>
        {title && <div className="font-bold mb-0.5">{title}</div>}
        <div className="leading-relaxed opacity-95">{message}</div>
      </div>
    </div>
  );
}
