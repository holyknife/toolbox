/**
 * Curriculum Development Centre (CDC) / National Examinations Board (NEB)
 * Letter Grading Directive 2078 (with amendments).
 */

export interface GradeInterval {
  letter: string;
  gradePoint: number;
  minPercent: number; // inclusive lower bound
  maxPercent: number; // exclusive upper bound, except 100
  description: string;
}

export const NEB_GRADING_METADATA = {
  directiveName: 'National Examinations Board Letter Grading Directive 2078',
  amendment: 'First Amendment 2079 / 2080 Implementation',
  effectiveDate: '2078 B.S. (2022 A.D.)',
  sourceUrl: 'https://neb.gov.np',
  dateLastVerified: '2026-04-15',
  theoryPassMinPercent: 35, // Minimum 35% in theoretical examination (D grade / GP 1.6)
  internalPassMinPercent: 40, // Minimum 40% in internal/practical evaluation (C grade / GP 2.0)
};

export const NEB_GRADE_SCALE: GradeInterval[] = [
  { letter: 'A+', gradePoint: 4.0, minPercent: 90, maxPercent: 100, description: 'Outstanding' },
  { letter: 'A',  gradePoint: 3.6, minPercent: 80, maxPercent: 90,  description: 'Excellent' },
  { letter: 'B+', gradePoint: 3.2, minPercent: 70, maxPercent: 80,  description: 'Very Good' },
  { letter: 'B',  gradePoint: 2.8, minPercent: 60, maxPercent: 70,  description: 'Good' },
  { letter: 'C+', gradePoint: 2.4, minPercent: 50, maxPercent: 60,  description: 'Satisfactory' },
  { letter: 'C',  gradePoint: 2.0, minPercent: 40, maxPercent: 50,  description: 'Acceptable' },
  { letter: 'D',  gradePoint: 1.6, minPercent: 35, maxPercent: 40,  description: 'Basic' },
  { letter: 'NG', gradePoint: 0.0, minPercent: 0,  maxPercent: 35,  description: 'Not Graded' },
];

/**
 * Maps a percentage (0 to 100) strictly according to NEB thresholds.
 * Strictly checks bounds without artificial premature rounding into higher grades.
 */
export function percentageToGrade(percent: number): { letter: string; gradePoint: number; description: string } {
  const p = Math.max(0, Math.min(100, percent));
  if (p >= 90) return { letter: 'A+', gradePoint: 4.0, description: 'Outstanding' };
  if (p >= 80) return { letter: 'A',  gradePoint: 3.6, description: 'Excellent' };
  if (p >= 70) return { letter: 'B+', gradePoint: 3.2, description: 'Very Good' };
  if (p >= 60) return { letter: 'B',  gradePoint: 2.8, description: 'Good' };
  if (p >= 50) return { letter: 'C+', gradePoint: 2.4, description: 'Satisfactory' };
  if (p >= 40) return { letter: 'C',  gradePoint: 2.0, description: 'Acceptable' };
  if (p >= 35) return { letter: 'D',  gradePoint: 1.6, description: 'Basic' };
  return { letter: 'NG', gradePoint: 0.0, description: 'Not Graded' };
}

/**
 * Returns the next higher grade threshold and required percentage.
 */
export function getNextGradeThreshold(percent: number): { nextGrade: string; targetPercent: number; diffPercent: number } | null {
  const p = Math.max(0, Math.min(100, percent));
  if (p >= 90) return null; // Already highest
  if (p >= 80) return { nextGrade: 'A+', targetPercent: 90, diffPercent: 90 - p };
  if (p >= 70) return { nextGrade: 'A',  targetPercent: 80, diffPercent: 80 - p };
  if (p >= 60) return { nextGrade: 'B+', targetPercent: 70, diffPercent: 70 - p };
  if (p >= 50) return { nextGrade: 'B',  targetPercent: 60, diffPercent: 60 - p };
  if (p >= 40) return { nextGrade: 'C+', targetPercent: 50, diffPercent: 50 - p };
  if (p >= 35) return { nextGrade: 'C',  targetPercent: 40, diffPercent: 40 - p };
  return { nextGrade: 'D', targetPercent: 35, diffPercent: 35 - p };
}

export const NEB_GRADING_SCALE = NEB_GRADE_SCALE.map((g) => ({
  ...g,
  grade: g.letter,
  minPercentage: g.minPercent,
  maxPercentage: g.maxPercent,
}));

export function getGradeFromPercentage(percent: number) {
  const info = percentageToGrade(percent);
  const scaleItem = NEB_GRADING_SCALE.find((s) => s.letter === info.letter) || NEB_GRADING_SCALE[NEB_GRADING_SCALE.length - 1];
  return {
    ...info,
    grade: info.letter,
    minPercentage: scaleItem.minPercent,
    maxPercentage: scaleItem.maxPercent,
  };
}

