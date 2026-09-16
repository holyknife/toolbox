import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  getGradeFromPercentage,
  NEB_GRADING_SCALE,
} from '../app/tools/calculators/config/neb-grading-rules';
import {
  evaluateSubject,
  calculateNebGpa,
  calculateTargetExamMarks,
} from '../app/tools/calculators/engines/neb-engine';
import {
  hillToSqFt,
  teraiToSqFt,
  convertFromSqFt,
} from '../app/tools/calculators/engines/land-engine';
import { calculateNepalSalaryTax } from '../app/tools/calculators/engines/tax-engine';
import {
  calculateNeaBill,
  calculateGold,
  calculateAttendance,
  calculateSgpa,
  calculateDateDiff,
  calculateAge,
} from '../app/tools/calculators/engines/everyday-engine';
import {
  calculators,
  getCalculatorBySlug,
} from '../app/tools/calculators/registry/calculators-registry';

function closeTo(actual: number, expected: number, tolerance = 1e-4) {
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `Expected ${actual} to be close to ${expected} (diff: ${Math.abs(actual - expected)})`
  );
}

// 1. NEB / CDC 2078 Grading Rules
test('NEB Directive 2078: boundary thresholds match official CDC scale', () => {
  assert.equal(getGradeFromPercentage(90).grade, 'A+');
  assert.equal(getGradeFromPercentage(90).gradePoint, 4.0);

  assert.equal(getGradeFromPercentage(89.99).grade, 'A');
  assert.equal(getGradeFromPercentage(80).grade, 'A');
  assert.equal(getGradeFromPercentage(80).gradePoint, 3.6);

  assert.equal(getGradeFromPercentage(79.99).grade, 'B+');
  assert.equal(getGradeFromPercentage(70).grade, 'B+');

  assert.equal(getGradeFromPercentage(60).grade, 'B');
  assert.equal(getGradeFromPercentage(50).grade, 'C+');
  assert.equal(getGradeFromPercentage(40).grade, 'C');

  assert.equal(getGradeFromPercentage(35).grade, 'D');
  assert.equal(getGradeFromPercentage(35).gradePoint, 1.6);

  assert.equal(getGradeFromPercentage(34.99).grade, 'NG');
  assert.equal(getGradeFromPercentage(34.99).gradePoint, 0.0);
  assert.equal(getGradeFromPercentage(0).grade, 'NG');
});

test('NEB Directive 2078: theory 35% and practical 40% component minimums', () => {
  // Case 1: Theory fails (< 35% of 75 = 26.25), Practical full 25/25
  const failedTheory = evaluateSubject({
    id: 'sub1',
    name: 'Math',
    creditHours: 5,
    theoryMarks: 25, // 25 < 26.25
    theoryFull: 75,
    internalMarks: 25,
    internalFull: 25,
  });
  assert.equal(failedTheory.isTheoryPassed, false);
  assert.equal(failedTheory.isInternalPassed, true);
  assert.equal(failedTheory.isNg, true);
  assert.equal(failedTheory.finalGrade, 'NG');
  assert.equal(failedTheory.gradePoint, 0.0);

  // Case 2: Practical fails (< 40% of 25 = 10), Theory full 75/75
  const failedInternal = evaluateSubject({
    id: 'sub2',
    name: 'Science',
    creditHours: 5,
    theoryMarks: 75,
    theoryFull: 75,
    internalMarks: 9, // 9 < 10
    internalFull: 25,
  });
  assert.equal(failedInternal.isTheoryPassed, true);
  assert.equal(failedInternal.isInternalPassed, false);
  assert.equal(failedInternal.isNg, true);
  assert.equal(failedInternal.finalGrade, 'NG');

  // Case 3: Both pass borderline (Theory 27/75, Internal 10/25 -> 37% total -> D)
  const passingBorderline = evaluateSubject({
    id: 'sub3',
    name: 'English',
    creditHours: 4,
    theoryMarks: 27,
    theoryFull: 75,
    internalMarks: 10,
    internalFull: 25,
  });
  assert.equal(passingBorderline.isNg, false);
  assert.equal(passingBorderline.finalGrade, 'D');
  assert.equal(passingBorderline.gradePoint, 1.6);
});

test('NEB GPA Calculation: credit-weighted GPA and NG handling', () => {
  const allPassingSubjects = [
    { id: '1', name: 'Nepali', creditHours: 5, theoryMarks: 60, theoryFull: 75, internalMarks: 23, internalFull: 25 },
    { id: '2', name: 'English', creditHours: 5, theoryMarks: 62, theoryFull: 75, internalMarks: 22, internalFull: 25 },
    { id: '3', name: 'Math', creditHours: 5, theoryMarks: 68, theoryFull: 75, internalMarks: 24, internalFull: 25 },
    { id: '4', name: 'Science', creditHours: 5, theoryMarks: 65, theoryFull: 75, internalMarks: 24, internalFull: 25 },
    { id: '5', name: 'Social', creditHours: 5, theoryMarks: 58, theoryFull: 75, internalMarks: 23, internalFull: 25 },
  ];

  const res = calculateNebGpa(allPassingSubjects);
  assert.equal(res.hasNg, false);
  assert.ok(res.gpa >= 3.6 && res.gpa <= 4.0);
  assert.equal(res.totalCredits, 25);
  assert.ok(res.status.includes('Graded'));

  // If one subject has NG, overall result is Non-Graded
  const oneNgSubjects = [
    ...allPassingSubjects.slice(0, 4),
    { id: '5', name: 'Social', creditHours: 5, theoryMarks: 20, theoryFull: 75, internalMarks: 23, internalFull: 25 },
  ];
  const ngRes = calculateNebGpa(oneNgSubjects);
  assert.equal(ngRes.hasNg, true);
  assert.equal(ngRes.ngCount, 1);
  assert.ok(ngRes.status.includes('Non-Graded'));
});

test('Target Exam Marks: calculates exact score needed for target grade', () => {
  // Aiming for A (80%) on 75-mark theory + 25-mark practical. Already have 23/25 in practical.
  // Total marks needed for 80% = 80. Required theory = 80 - 23 = 57.
  const target = calculateTargetExamMarks({
    targetGrade: 'A',
    theoryFullMarks: 75,
    internalFullMarks: 25,
    internalObtainedMarks: 23,
  });
  assert.equal(target.isPossible, true);
  assert.equal(target.requiredTheoryMarks, 57);
});

// 2. Nepal Land Measurement Units
test('Nepal Land: Hill (R-A-P-D) to square feet exact identities', () => {
  // 1 Ropani = 5,476 sq ft
  assert.equal(hillToSqFt(1, 0, 0, 0), 5476);
  // 1 Aana = 342.25 sq ft
  assert.equal(hillToSqFt(0, 1, 0, 0), 342.25);
  // 1 Paisa = 85.5625 sq ft
  assert.equal(hillToSqFt(0, 0, 1, 0), 85.5625);
  // 1 Daam = 21.390625 sq ft
  assert.equal(hillToSqFt(0, 0, 0, 1), 21.390625);

  // 16 Aana = 1 Ropani
  closeTo(hillToSqFt(0, 16, 0, 0), 5476);
  // 4 Paisa = 1 Aana
  closeTo(hillToSqFt(0, 0, 4, 0), 342.25);
  // 4 Daam = 1 Paisa
  closeTo(hillToSqFt(0, 0, 0, 4), 85.5625);
});

test('Nepal Land: Terai (B-K-D) to square feet exact identities', () => {
  // 1 Bigha = 72,900 sq ft
  assert.equal(teraiToSqFt(1, 0, 0), 72900);
  // 1 Kattha = 3,645 sq ft
  assert.equal(teraiToSqFt(0, 1, 0), 3645);
  // 1 Dhur = 182.25 sq ft
  assert.equal(teraiToSqFt(0, 0, 1), 182.25);

  // 20 Kattha = 1 Bigha
  assert.equal(teraiToSqFt(0, 20, 0), 72900);
  // 20 Dhur = 1 Kattha
  assert.equal(teraiToSqFt(0, 0, 20), 3645);
});

test('Nepal Land: Decomposition and bidirectional conversion', () => {
  const converted = convertFromSqFt(5476);
  assert.equal(converted.compoundHill.ropani, 1);
  assert.equal(converted.compoundHill.aana, 0);
  assert.equal(converted.decimalRopani, 1.0);
  assert.equal(converted.compoundTerai.bigha, 0);
  assert.equal(converted.compoundTerai.kattha, 1); // 5476 / 3645 = 1 kattha remainder
});

// 3. Nepal Personal Salary Tax
test('Nepal Salary Tax: FY 2081/82 Individual slabs and SSF 1% waiver', () => {
  // Annual salary Rs 4,80,000 (Within 1st slab of Rs 5,00,000)
  // Without SSF: 1% Social Security Tax = Rs 4,800
  const taxNonSsf = calculateNepalSalaryTax({
    fiscalYear: '2081-82',
    isMarried: false,
    annualSalary: 480000,
    pfCitDeduction: 0,
    lifeInsurancePremium: 0,
    healthInsurancePremium: 0,
    isSsfContributor: false,
  });
  assert.equal(taxNonSsf.annualTax, 4800);

  // With SSF: 1% SST waived on 1st bracket
  const taxSsf = calculateNepalSalaryTax({
    fiscalYear: '2081-82',
    isMarried: false,
    annualSalary: 480000,
    pfCitDeduction: 0,
    lifeInsurancePremium: 0,
    healthInsurancePremium: 0,
    isSsfContributor: true,
  });
  assert.equal(taxSsf.annualTax, 0);
});

test('Nepal Salary Tax: Section 63 PF/CIT deduction caps', () => {
  // Salary Rs 12,00,000. 1/3 is Rs 4,00,000. But max statutory cap is Rs 3,00,000.
  const res = calculateNepalSalaryTax({
    fiscalYear: '2081-82',
    isMarried: false,
    annualSalary: 1200000,
    pfCitDeduction: 500000, // exceeds cap
    lifeInsurancePremium: 60000, // exceeds Rs 40,000 cap
    healthInsurancePremium: 30000, // exceeds Rs 20,000 cap
    isSsfContributor: true,
  });
  assert.equal(res.deductionBreakdown.pfCitAllowed, 300000);
  assert.equal(res.deductionBreakdown.lifeInsuranceAllowed, 40000);
  assert.equal(res.deductionBreakdown.healthInsuranceAllowed, 20000);
  assert.equal(res.totalDeductions, 360000);
  assert.equal(res.netTaxableIncome, 1200000 - 360000);
});

// 4. Everyday Calculators (NEA, Gold, Attendance, SGPA)
test('NEA Electricity Bill: 5A Lifeline and tiered tariffs', () => {
  // 15 units on 5A: free energy charge, Rs 30 minimum
  const lifeline = calculateNeaBill(15, '5A');
  assert.equal(lifeline.minimumCharge, 30);
  assert.equal(lifeline.energyCharge, 0);
  assert.equal(lifeline.totalBill, 30);

  // 85 units on 5A
  const bill85 = calculateNeaBill(85, '5A');
  assert.ok(bill85.totalBill > 500);
});

test('Gold / Tola: exact conversion standard (11.6638g)', () => {
  const gold = calculateGold(1, 'tola', 150000);
  assert.equal(gold.tola, 1);
  assert.equal(gold.grams, 11.664); // rounded to 3 decimals
  assert.equal(gold.metalCost, 150000);
  assert.equal(gold.totalCost, 150000);
});

test('Attendance: 75% eligibility and consecutive recovery', () => {
  // 60 out of 80 attended = 75% exactly
  const exact = calculateAttendance(80, 60, 75);
  assert.equal(exact.currentPercent, 75);
  assert.equal(exact.status, 'eligible');
  assert.equal(exact.canMissClasses, 0);

  // 50 out of 80 attended = 62.5% -> shortage
  const short = calculateAttendance(80, 50, 75);
  assert.equal(short.status, 'shortage');
  assert.ok(short.needToAttendConsecutive > 0);
});

test('SGPA & CGPA: credit-weighted university grade points', () => {
  const semesters = [
    { semester: 'Sem 1', creditHours: 20, gpa: 3.5 },
    { semester: 'Sem 2', creditHours: 20, gpa: 3.9 },
  ];
  const res = calculateSgpa(semesters);
  assert.equal(res.totalCredits, 40);
  assert.equal(res.cgpa, 3.7);
});

// 5. Registry Integrity Smoke Test
test('Calculators Registry: all 26 tools are registered with complete metadata', () => {
  assert.equal(calculators.length, 26);
  for (const c of calculators) {
    assert.ok(c.id && c.id.length > 0, `Missing id on ${c.slug}`);
    assert.ok(c.slug && c.slug.length > 0, `Missing slug on ${c.id}`);
    assert.ok(c.title && c.title.length > 0, `Missing title on ${c.slug}`);
    assert.ok(c.category && c.category.length > 0, `Missing category on ${c.slug}`);
    assert.ok(Array.isArray(c.keywords) && c.keywords.length > 0, `Missing keywords on ${c.slug}`);
    assert.ok(getCalculatorBySlug(c.slug), `getCalculatorBySlug failed for ${c.slug}`);
  }
});
