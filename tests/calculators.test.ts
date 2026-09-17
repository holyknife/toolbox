import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../app/tools/calculators/calculate';
import { dateDifference, parseDate } from '../app/tools/calculators/dates';
import { calculateAge, calculateBmi } from '../app/tools/calculators/engines/everyday-engine';
import { calculateEmi, calculateDiscount } from '../app/tools/calculators/engines/finance-engine';
import { calculators, getCalculatorBySlug } from '../app/tools/calculators/registry/calculators-registry';

function close(actual: number, expected: number, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}

// 1. Registry Integrity Test (strictly the 9 curated calculators)
test('Calculators Registry: exactly the 9 requested calculators are registered with complete metadata', () => {
  assert.equal(calculators.length, 9);

  const expectedSlugs = [
    'percentage',
    'bmi',
    'age',
    'loan-emi',
    'tip',
    'discount',
    'date-difference',
    'gpa',
    'currency-converter',
  ];

  const actualSlugs = calculators.map((c) => c.slug);
  assert.deepEqual(actualSlugs.sort(), expectedSlugs.sort());

  for (const calc of calculators) {
    assert.ok(calc.id && calc.id.length > 0, `Missing id on ${calc.slug}`);
    assert.ok(calc.slug && calc.slug.length > 0, `Missing slug on ${calc.id}`);
    assert.ok(calc.title && calc.title.length > 0, `Missing title on ${calc.slug}`);
    assert.ok(calc.category && calc.category.length > 0, `Missing category on ${calc.slug}`);
    assert.ok(Array.isArray(calc.keywords) && calc.keywords.length > 0, `Missing keywords on ${calc.slug}`);
    assert.ok(getCalculatorBySlug(calc.slug), `getCalculatorBySlug failed for ${calc.slug}`);
  }

  // Aliases check
  assert.equal(getCalculatorBySlug('currency')?.slug, 'currency-converter');
  assert.equal(getCalculatorBySlug('forex')?.slug, 'currency-converter');
  assert.equal(getCalculatorBySlug('loan')?.slug, 'loan-emi');
  assert.equal(getCalculatorBySlug('emi')?.slug, 'loan-emi');
  assert.equal(getCalculatorBySlug('percent')?.slug, 'percentage');
  assert.equal(getCalculatorBySlug('bs-ad-age')?.slug, 'age');
});

// 2. Percentage Calculator tests
test('Percentage operations: of, isWhat, change, addSubtract', () => {
  // What is X% of Y?
  const p1 = (15 / 100) * 250;
  assert.equal(p1, 37.5);

  // X is what % of Y?
  const p2 = (45 / 180) * 100;
  assert.equal(p2, 25);

  // Percentage Change
  const init = 80;
  const fin = 100;
  const change = ((fin - init) / Math.abs(init)) * 100;
  assert.equal(change, 25);

  // Add / Subtract %
  const base = 150;
  const pct = 13;
  const delta = (pct / 100) * base;
  assert.equal(base + delta, 169.5);
  assert.equal(base - delta, 130.5);
});

// 3. Discount Calculator tests
test('Discount: standard savings and price reduction', () => {
  const d1 = calculateDiscount(1000, 20);
  assert.equal(d1.discountAmount, 200);
  assert.equal(d1.finalPrice, 800);

  const d2 = calculateDiscount(2500, 0);
  assert.equal(d2.discountAmount, 0);
  assert.equal(d2.finalPrice, 2500);

  const d3 = calculateDiscount(500, 100);
  assert.equal(d3.discountAmount, 500);
  assert.equal(d3.finalPrice, 0);
});

// 4. Tip Calculator tests
test('Tip / Bill Splitter: even split without fractional unpaid remainder', () => {
  assert.deepEqual(c.tip(100, 20, 3), { tip: 20, total: 120, each: 40 });
  assert.equal(c.tip(10, 0, 3).each, 3.34);
  assert.throws(() => c.tip(100, 10, 0));
  assert.throws(() => c.tip(100, 10, 1.5));
});

// 5. Loan / EMI Calculator tests
test('Loan EMI: reducing balance formula and principal amortization', () => {
  const emiRes = calculateEmi(100000, 10, 60);
  close(emiRes.emi, 2124.704, 1e-2);
  assert.ok(emiRes.totalPayment > 100000);
  close(emiRes.totalInterest, emiRes.totalPayment - 100000, 1e-4);
  assert.ok(emiRes.schedule.length > 0);
  assert.equal(emiRes.schedule[emiRes.schedule.length - 1].balance, 0);
});

// 6. BMI Calculator tests
test('BMI: metric formulas and WHO category boundaries', () => {
  const b1 = calculateBmi(70, 1.75);
  close(b1.bmi, 22.9, 0.1);
  assert.equal(b1.category, 'Normal weight');

  const b2 = calculateBmi(50, 1.75);
  assert.equal(b2.category, 'Underweight');

  const b3 = calculateBmi(85, 1.75);
  assert.equal(b3.category, 'Overweight');

  const b4 = calculateBmi(110, 1.75);
  assert.equal(b4.category, 'Obesity');
});

// 7. Date Difference tests
test('Date difference: exact calendar anniversary and day count', () => {
  assert.deepEqual(dateDifference('2024-01-31', '2024-02-29'), {
    years: 0,
    months: 1,
    days: 0,
    totalMonths: 1,
    totalDays: 29,
  });
  assert.equal(dateDifference('2024-03-09', '2024-03-11').totalDays, 2);
  assert.equal(dateDifference('2024-01-01', '2024-01-01').totalDays, 0);
  assert.throws(() => parseDate('2023-02-29'));
  assert.throws(() => dateDifference('2024-02-01', '2024-01-01'));
});

// 8. Age Calculator tests
test('Age: exact calendar anniversaries and countdown', () => {
  const age = calculateAge({ year: 2000, month: 1, day: 1 }, 'AD');
  assert.ok(age.years >= 25);
  assert.ok(age.totalDays > 9000);
  assert.ok(age.dayOfWeek.length > 0);
  assert.ok(age.nextBirthdayDays >= 0 && age.nextBirthdayDays <= 366);
});

// 9. GPA Calculator tests
test('GPA: credit-weighted grade points', () => {
  close(
    c.weightedAverage(
      [
        { score: 4, weight: 3 },
        { score: 3, weight: 1 },
      ],
      4
    ).value,
    3.75
  );
  assert.throws(() => c.weightedAverage([{ score: 5, weight: 3 }], 4));
  assert.throws(() => c.weightedAverage([{ score: 3, weight: 0 }], 4));
});
