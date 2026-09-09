import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../app/tools/calculators/calculate';
import { dateDifference, parseDate } from '../app/tools/calculators/dates';
import { calculators } from '../app/tools/calculators/calculators-registry';

// Published arithmetic identities and independently calculated examples catch formula errors.
function close(actual: number, expected: number, tolerance = 1e-8) { assert.ok(Math.abs(actual - expected) < tolerance,`${actual} != ${expected}`); }
test('basic arithmetic obeys precedence, parentheses, unary signs, percentages, and errors', () => {
  assert.equal(c.arithmetic('(120 + 80) * 10%'),20);
  assert.equal(c.arithmetic('2+3*4'),14);
  assert.equal(c.arithmetic('-(5-8)/2'),1.5);
  assert.equal(c.arithmetic('1e3 + .5'),1000.5);
  for (const source of ['1/0','2(3)','alert(1)','(1+2','1 2','1e999']) assert.throws(() => c.arithmetic(source));
});
test('discount handles no discount and a free item', () => {
  assert.deepEqual(c.discount(1000,20),{saved:200,total:800});
  assert.equal(c.discount(99,100).total,0);
  assert.equal(c.discount(99,0).total,99);
});
test('tip splits evenly without an unpaid fractional cent', () => {
  assert.deepEqual(c.tip(100,20,3),{tip:20,total:120,each:40});
  assert.equal(c.tip(10,0,3).each,3.34);
  assert.throws(() => c.tip(100,10,0));
  assert.throws(() => c.tip(100,10,1.5));
});
test('tax inclusive and exclusive operations are inverses', () => {
  const added = c.tax(1000,13,false);
  close(added.total,1130);
  const removed = c.tax(added.total,13,true);
  close(removed.base,1000); close(removed.tax,130);
  close(c.tax(100,0,true).total,100);
});
test('margin distinguishes markup, negative profit, and zero cost', () => {
  assert.deepEqual(c.margin(60,100),{profit:40,margin:40,markup:40/60*100});
  assert.equal(c.margin(100,50).margin,-100);
  assert.equal(c.margin(0,50).markup,null);
  assert.throws(() => c.margin(10,0));
});
test('simple interest uses annual rate and fractional years', () => {
  assert.deepEqual(c.simpleInterest(1000,10,0.5),{interest:50,total:1050});
  assert.equal(c.simpleInterest(1000,0,5).interest,0);
});
test('compound interest handles annual, monthly, and zero-rate growth', () => {
  close(c.compoundInterest(1000,10,2,1).total,1210);
  close(c.compoundInterest(1000,12,1,12).total,1126.8250301319698);
  assert.equal(c.compoundInterest(1000,0,10,12).total,1000);
  assert.throws(() => c.compoundInterest(1e15,1000,1000,365),/too large/);
});
test('loan EMI includes zero interest and amortizes principal to zero', () => {
  close(c.loan(100000,10,60).payment,2124.704471126833,1e-6);
  assert.equal(c.loan(12000,0,12).payment,1000);
  const result = c.loan(50000,6,24);
  let balance = 50000;
  for (let month = 0; month < 24; month++) balance = balance * 1.005 - result.payment;
  close(balance,0,1e-6);
  assert.throws(() => c.loan(100,5,1.2));
});
test('BMI uses metric formula and unrounded category boundaries', () => {
  close(c.bmi(70,175).value,22.857142857142858);
  assert.equal(c.bmi(25,100).category,'Overweight');
  assert.equal(c.bmi(18.5,100).category,'Healthy weight');
  close(c.bmi(154.3235835294143 * 0.45359237,68.89763779527559 * 2.54).value,c.bmi(70,175).value);
  assert.throws(() => c.bmi(70,0));
});
test('aspect ratios reduce and resize in both directions', () => {
  assert.deepEqual(c.aspectRatio(1920,1080,1280,true),{ratio:'16:9',width:1280,height:720});
  assert.deepEqual(c.aspectRatio(1920,1080,720,false),{ratio:'16:9',width:1280,height:720});
  assert.throws(() => c.aspectRatio(0,100,10,true));
});
test('date differences handle same day, leap day, month ends, and DST-independent days', () => {
  assert.deepEqual(dateDifference('2024-01-31','2024-02-29'),{years:0,months:1,days:0,totalMonths:1,totalDays:29});
  assert.equal(dateDifference('2024-03-09','2024-03-11').totalDays,2);
  assert.equal(dateDifference('2024-01-01','2024-01-01').totalDays,0);
  assert.throws(() => parseDate('2023-02-29'));
  assert.throws(() => dateDifference('2024-02-01','2024-01-01'));
});
test('age uses exact clamped calendar anniversaries', () => {
  const age = dateDifference('2000-02-29','2025-02-28');
  assert.equal(age.years,25); assert.equal(age.months,0); assert.equal(age.days,0);
  const next = dateDifference('2000-06-15','2025-08-20');
  assert.equal(next.years,25); assert.equal(next.months,2); assert.equal(next.days,5);
});
test('GPA weights grade points by credits and validates scale', () => {
  close(c.weightedAverage([{score:4,weight:3},{score:3,weight:1}],4).value,3.75);
  assert.throws(() => c.weightedAverage([{score:5,weight:3}],4));
  assert.throws(() => c.weightedAverage([{score:3,weight:0}],4));
});
test('grade modes cover weighted, final, attainable and impossible required marks', () => {
  close(c.weightedAverage([{score:80,weight:40},{score:90,weight:60}],100).value,86);
  close(c.finalGrade(80,90,40),84);
  close(c.requiredGrade(80,85,40),92.5);
  assert.ok(c.requiredGrade(50,90,20) > 100);
  assert.ok(c.requiredGrade(100,50,20) < 0);
  assert.throws(() => c.requiredGrade(80,85,0));
});
test('every registered scalar calculator computes finite results with its defaults', () => {
  assert.equal(calculators.length,14);
  for (const calculator of calculators) {
    if (!calculator.calculate) continue;
    const values = Object.fromEntries(calculator.fields!.map(field => [field.key,field.value === 'today' ? '2026-09-09' : field.value]));
    const results = calculator.calculate(values);
    assert.ok(results.length,calculator.slug);
    for (const result of results) if (typeof result.value === 'number') assert.ok(Number.isFinite(result.value),calculator.slug);
  }
  for (const value of ['','NaN','Infinity','-1']) assert.throws(() => c.numberInput(value,'Amount'));
});
