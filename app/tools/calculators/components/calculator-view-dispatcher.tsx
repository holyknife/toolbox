'use client';

import React from 'react';
import { getCalculatorBySlug } from '../registry/calculators-registry';
import SeeGpaView from './views/see-gpa-view';
import SeePlannerView from './views/see-planner-view';
import Neb12GpaView from './views/neb-12-gpa-view';
import Neb12PlannerView from './views/neb-12-planner-view';
import NebSubjectGradeView from './views/neb-subject-grade-view';
import NebConverterView from './views/neb-converter-view';
import TargetMarksView from './views/target-marks-view';
import AttendanceView from './views/attendance-view';
import SgpaCgpaView from './views/sgpa-cgpa-view';
import NepalLandView from './views/nepal-land-view';
import NepalTaxView from './views/nepal-tax-view';
import TolaGoldView from './views/tola-gold-view';
import NepalElectricityView from './views/nepal-electricity-view';
import BsadAgeView from './views/bsad-age-view';
import DateDiffView from './views/date-diff-view';
import {
  LoanEmiView,
  VatView,
  DiscountView,
  ProfitMarginView,
  SimpleInterestView,
  CompoundInterestView,
  SavingsGoalView,
} from './views/finance-views';
import {
  FuelCostView,
  TipView,
  BmiView,
  AspectRatioView,
  BasicKeypadView,
} from './views/everyday-views';

interface Props {
  slug: string;
}

export default function CalculatorViewDispatcher({ slug }: Props) {
  const calc = getCalculatorBySlug(slug);
  const resolvedSlug = calc?.slug || slug;

  switch (resolvedSlug) {
    case 'see-gpa':
      return <SeeGpaView />;
    case 'see-gpa-planner':
      return <SeePlannerView />;
    case 'neb-class-12-gpa':
      return <Neb12GpaView />;
    case 'neb-class-12-planner':
      return <Neb12PlannerView />;
    case 'neb-subject-grade':
      return <NebSubjectGradeView />;
    case 'neb-marks-converter':
      return <NebConverterView />;
    case 'target-marks':
      return <TargetMarksView />;
    case 'attendance':
      return <AttendanceView />;
    case 'sgpa-cgpa':
      return <SgpaCgpaView />;
    case 'loan-emi':
      return <LoanEmiView />;
    case 'vat-tax':
      return <VatView />;
    case 'discount':
      return <DiscountView />;
    case 'profit-margin':
      return <ProfitMarginView />;
    case 'simple-interest':
      return <SimpleInterestView />;
    case 'compound-interest':
      return <CompoundInterestView />;
    case 'savings-goal':
      return <SavingsGoalView />;
    case 'nepal-salary-tax':
      return <NepalTaxView />;
    case 'nepal-land-converter':
      return <NepalLandView />;
    case 'tola-gold-converter':
      return <TolaGoldView />;
    case 'bs-ad-age':
      return <BsadAgeView />;
    case 'date-difference':
      return <DateDiffView />;
    case 'trip-fuel-cost':
      return <FuelCostView />;
    case 'nepal-electricity-bill':
      return <NepalElectricityView />;
    case 'tip':
      return <TipView />;
    case 'bmi':
      return <BmiView />;
    case 'aspect-ratio':
      return <AspectRatioView />;
    case 'basic':
      return <BasicKeypadView />;
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
