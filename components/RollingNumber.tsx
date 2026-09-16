'use client';

import React from 'react';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface RollingDigitProps {
  digit: number;
  delayIndex?: number;
}

function RollingDigit({ digit, delayIndex = 0 }: RollingDigitProps) {
  const safeDigit = Math.max(0, Math.min(9, Math.floor(digit)));

  return (
    <span className="rolling-digit-box" aria-hidden="true">
      <span
        className="rolling-digit-strip"
        style={{
          transform: `translate3d(0, ${-safeDigit * 10}%, 0)`,
          transitionDelay: `${delayIndex * 35}ms`,
        }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="rolling-digit-cell">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

interface RollingNumberProps {
  value: number | string;
  pad?: number;
  className?: string;
  ariaLabel?: string;
}

export default function RollingNumber({
  value,
  pad,
  className = '',
  ariaLabel,
}: RollingNumberProps) {
  let str = String(value);
  if (typeof pad === 'number' && pad > 0 && /^\d+$/.test(str)) {
    str = str.padStart(pad, '0');
  }

  const label = ariaLabel || str;

  return (
    <span className={`rolling-number ${className}`.trim()} aria-label={label}>
      {str.split('').map((char, index) => {
        if (/\d/.test(char)) {
          return (
            <RollingDigit
              key={`digit-${index}`}
              digit={Number(char)}
              delayIndex={index}
            />
          );
        }
        return (
          <span key={`char-${index}`} className="rolling-char" aria-hidden="true">
            {char}
          </span>
        );
      })}
    </span>
  );
}
