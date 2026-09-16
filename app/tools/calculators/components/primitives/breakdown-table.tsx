'use client';

import React from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface BreakdownTableProps<T> {
  columns: Column<T>[];
  data: T[];
  footerRow?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export default function BreakdownTable<T extends { id?: string | number }>({
  columns,
  data,
  footerRow,
  emptyMessage = 'No breakdown data available',
  className = '',
}: BreakdownTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-text-dim border border-dashed border-border rounded-xl">
        {emptyMessage}
      </div>
    );
  }

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  return (
    <div className={`overflow-x-auto rounded-xl border border-border/80 bg-card/60 ${className}`}>
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-muted/60 text-text-dim border-b border-border text-[11px] font-semibold uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-2.5 px-3 font-semibold ${getAlignClass(col.align)} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((row, rowIdx) => (
            <tr key={row.id ?? rowIdx} className="hover:bg-muted/30 transition-colors">
              {columns.map((col, colIdx) => {
                const cellContent =
                  typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : col.accessor
                    ? (row[col.accessor] as unknown as React.ReactNode)
                    : null;

                return (
                  <td
                    key={colIdx}
                    className={`py-2.5 px-3 text-text ${getAlignClass(col.align)} ${col.className || ''}`}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {footerRow && (
          <tfoot className="border-t border-border bg-muted/40 font-semibold text-text">
            {footerRow}
          </tfoot>
        )}
      </table>
    </div>
  );
}
