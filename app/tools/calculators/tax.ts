import { numberInput, finite } from './calculate';

export interface TaxFields { rate: string; before: string; after: string }
export type TaxField = keyof TaxFields;
export interface TaxCalculation { rate: number; before: number; after: number; tax: number; filled: TaxField | null }

// Solve the missing quantity from any two inputs. Zero counts as an entered value.
export function solveTax(fields: TaxFields): TaxCalculation {
  const supplied = (Object.keys(fields) as TaxField[]).filter(key => fields[key].trim() !== '');
  if (supplied.length < 2) throw new Error('Enter any two values. One value alone is not enough to calculate the bill.');
  let rate = fields.rate.trim() ? numberInput(fields.rate,'Tax rate',0,1000000) : null;
  let before = fields.before.trim() ? numberInput(fields.before,'Price before tax',0,1e15) : null;
  let after = fields.after.trim() ? numberInput(fields.after,'Price after tax',0,1e15) : null;
  let filled: TaxField | null = null;
  if (rate === null) {
    if (before === 0) throw new Error('A tax rate cannot be determined from a zero price before tax. Enter the tax rate instead.');
    if (after! < before!) throw new Error('Price after tax must be at least the price before tax.');
    rate = finite((after! - before!) / before! * 100);
    filled = 'rate';
  } else if (before === null) {
    before = finite(after! / (1 + rate / 100));
    filled = 'before';
  } else if (after === null) {
    after = finite(before * (1 + rate / 100));
    filled = 'after';
  } else {
    // Three entered values should agree within half a currency cent after rounding.
    const expected = finite(before * (1 + rate / 100));
    const tolerance = Math.max(0.005,Math.abs(expected) * Number.EPSILON * 4);
    if (Math.abs(after - expected) > tolerance) throw new Error('These three values do not match. Clear the value you want calculated, then try again.');
  }
  return { rate:rate!, before:before!, after:after!, tax:finite(after! - before!), filled };
}
