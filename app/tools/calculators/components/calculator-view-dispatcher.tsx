'use client';

import React from 'react';
import { getCalculatorBySlug } from '../registry/calculators-registry';
import PercentageView from './views/percentage-view';
import CurrencyView from './views/currency-view';
import GpaView from './views/gpa-view';
import AgeView from './views/age-view';
import DateDiffView from './views/date-diff-view';
import { LoanEmiView, DiscountView } from './views/finance-views';
import { TipView, BmiView } from './views/everyday-views';

interface Props {
  slug: string;
}

export default function CalculatorViewDispatcher({ slug }: Props) {
  const calc = getCalculatorBySlug(slug);
  const resolvedSlug = calc?.slug || slug.toLowerCase();

  switch (resolvedSlug) {
    case 'percentage':
    case 'percent':
      return <PercentageView />;

    case 'currency-converter':
    case 'currency':
    case 'forex':
      return <CurrencyView />;

    case 'gpa':
    case 'grade':
      return <GpaView />;

    case 'age':
    case 'bs-ad-age':
      return <AgeView />;

    case 'loan-emi':
    case 'loan':
    case 'emi':
      return <LoanEmiView />;

    case 'discount':
      return <DiscountView />;

    case 'tip':
      return <TipView />;

    case 'bmi':
      return <BmiView />;

    case 'date-difference':
    case 'dates':
      return <DateDiffView />;

    default:
      return (
        <div className="p-8 text-center bg-card rounded-2xl border border-border">
          <h2 className="text-xl font-bold mb-2">Calculator Ready</h2>
          <p className="text-text-dim text-sm">
            {calc?.title || 'This calculator'} is being loaded.
          </p>
        </div>
      );
  }
}
