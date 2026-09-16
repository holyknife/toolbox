import {
  percentageToGrade,
  getNextGradeThreshold,
  NEB_GRADING_METADATA,
} from '../config/neb-grading-rules';

export interface SubjectInput {
  id: string;
  name: string;
  creditHours: number;
  theoryMarks: number;
  theoryFullMarks?: number;
  theoryFull?: number;
  internalMarks: number;
  internalFullMarks?: number;
  internalFull?: number;
  isElective?: boolean;
}

export type SubjectEntry = SubjectInput;

export interface SubjectEvaluation {
  id: string;
  name: string;
  creditHours: number;
  theoryMarks: number;
  theoryFullMarks: number;
  theoryPercent: number;
  theoryPassed: boolean;
  isTheoryPassed: boolean;
  theoryGrade: string;
  internalMarks: number;
  internalFullMarks: number;
  internalPercent: number;
  internalPassed: boolean;
  isInternalPassed: boolean;
  internalGrade: string;
  totalObtained: number;
  totalFullMarks: number;
  totalPercent: number;
  combinedPercentage: number;
  theoryPercentage: number;
  internalPercentage: number;
  totalFull: number;
  letterGrade: string;
  finalGrade: string;
  finalRemarks: string;
  gradePoint: number;
  isNG: boolean;
  isNg: boolean;
  weightedPoints: number;
  ngReason?: string;
  nextThreshold?: { nextGrade: string; marksNeeded: number } | null;
}

export interface GpaResult {
  gpa: number;
  overallStatus: 'Passed' | 'Not Graded (NG)';
  status: string;
  overallGrade: string;
  gradedSubjectsCount: number;
  totalCreditHours: number;
  totalCredits: number;
  totalWeightedPoints: number;
  totalQualityPoints: number;
  totalObtainedMarks: number;
  totalFullMarks: number;
  percentage: number;
  subjects: SubjectEvaluation[];
  evaluatedSubjects: SubjectEvaluation[];
  hasNG: boolean;
  hasNg: boolean;
  ngCount: number;
  ngSubjects: string[];
}

/**
 * Evaluates a single subject component according to official CDC / NEB rules.
 */
export function evaluateSubject(s: SubjectInput): SubjectEvaluation {
  const theoryFull = Math.max(1, s.theoryFullMarks ?? s.theoryFull ?? 75);
  const internalFull = Math.max(1, s.internalFullMarks ?? s.internalFull ?? 25);

  const theoryMarks = Math.max(0, Math.min(theoryFull, s.theoryMarks));
  const internalMarks = Math.max(0, Math.min(internalFull, s.internalMarks));

  const theoryPercent = (theoryMarks / theoryFull) * 100;
  const internalPercent = (internalMarks / internalFull) * 100;

  // Rule: Under Letter Grading Directive 2078, theory minimum is 35% (D grade)
  // and internal minimum is 40% (C grade).
  const theoryPassed = theoryPercent >= NEB_GRADING_METADATA.theoryPassMinPercent;
  const internalPassed = internalPercent >= NEB_GRADING_METADATA.internalPassMinPercent;

  const totalObtained = theoryMarks + internalMarks;
  const totalFullMarks = theoryFull + internalFull;
  const totalPercent = (totalObtained / totalFullMarks) * 100;

  let isNG = false;
  let ngReason: string | undefined;

  if (!theoryPassed && !internalPassed) {
    isNG = true;
    ngReason = `Theory (${theoryPercent.toFixed(1)}% < 35%) and Internal (${internalPercent.toFixed(1)}% < 40%) below minimum`;
  } else if (!theoryPassed) {
    isNG = true;
    ngReason = `Theory score below minimum 35% (${theoryMarks}/${theoryFull} = ${theoryPercent.toFixed(1)}%)`;
  } else if (!internalPassed) {
    isNG = true;
    ngReason = `Internal/practical score below minimum 40% (${internalMarks}/${internalFull} = ${internalPercent.toFixed(1)}%)`;
  }

  let letterGrade: string;
  let gradePoint: number;

  if (isNG) {
    letterGrade = 'NG';
    gradePoint = 0.0;
  } else {
    const gradeInfo = percentageToGrade(totalPercent);
    letterGrade = gradeInfo.letter;
    gradePoint = gradeInfo.gradePoint;
  }

  const credits = Math.max(0, s.creditHours);
  const weightedPoints = gradePoint * credits;

  // Next grade threshold calculation
  const next = getNextGradeThreshold(totalPercent);
  const nextThreshold = next
    ? {
        nextGrade: next.nextGrade,
        marksNeeded: Math.max(0, Math.ceil((next.targetPercent / 100) * totalFullMarks - totalObtained)),
      }
    : null;

  const theoryGrade = percentageToGrade(theoryPercent).letter;
  const internalGrade = percentageToGrade(internalPercent).letter;

  return {
    id: s.id,
    name: s.name,
    creditHours: credits,
    theoryMarks,
    theoryFullMarks: theoryFull,
    theoryPercent,
    theoryPassed,
    isTheoryPassed: theoryPassed,
    theoryGrade,
    internalMarks,
    internalFullMarks: internalFull,
    internalPercent,
    internalPassed,
    isInternalPassed: internalPassed,
    internalGrade,
    totalObtained,
    totalFullMarks,
    totalPercent,
    combinedPercentage: totalPercent,
    theoryPercentage: theoryPercent,
    internalPercentage: internalPercent,
    totalFull: totalFullMarks,
    letterGrade,
    finalGrade: letterGrade,
    finalRemarks: letterGrade === 'NG' ? 'Non-Graded' : 'Passed',
    gradePoint,
    isNG,
    isNg: isNG,
    weightedPoints,
    ngReason,
    nextThreshold,
  };
}

/**
 * Calculates overall GPA from a list of subjects using credit-hour weighting.
 */
export function calculateNebGpa(subjects: SubjectInput[]): GpaResult {
  if (!subjects.length) {
    return {
      gpa: 0,
      overallStatus: 'Not Graded (NG)',
      status: 'Not Graded (NG)',
      overallGrade: 'NG',
      gradedSubjectsCount: 0,
      totalCreditHours: 0,
      totalCredits: 0,
      totalWeightedPoints: 0,
      totalQualityPoints: 0,
      totalObtainedMarks: 0,
      totalFullMarks: 0,
      percentage: 0,
      subjects: [],
      evaluatedSubjects: [],
      hasNG: false,
      hasNg: false,
      ngCount: 0,
      ngSubjects: [],
    };
  }

  const evaluated = subjects.map(evaluateSubject);
  const totalCredits = evaluated.reduce((sum, s) => sum + s.creditHours, 0);
  const totalWeighted = evaluated.reduce((sum, s) => sum + s.weightedPoints, 0);
  const totalObtained = evaluated.reduce((sum, s) => sum + s.totalObtained, 0);
  const totalFull = evaluated.reduce((sum, s) => sum + s.totalFullMarks, 0);

  const ngSubjects = evaluated.filter(s => s.isNG).map(s => s.name);
  const hasNG = ngSubjects.length > 0;

  // Under official NEB rules, if any subject is NG, the final certificate does not award a GPA.
  // We calculate the numeric GPA for academic reference but explicitly mark status as NG.
  const rawGpa = totalCredits > 0 ? totalWeighted / totalCredits : 0;
  const gpa = Number(rawGpa.toFixed(2));
  const overallGrade = hasNG ? 'NG' : percentageToGrade((gpa / 4.0) * 100).letter;
  const percentage = totalFull > 0 ? Number(((totalObtained / totalFull) * 100).toFixed(1)) : 0;

  return {
    gpa,
    overallStatus: hasNG ? 'Not Graded (NG)' : 'Passed',
    status: hasNG ? `Non-Graded (${ngSubjects.length} NG)` : 'Graded / Promoted',
    overallGrade,
    gradedSubjectsCount: evaluated.length,
    totalCreditHours: totalCredits,
    totalCredits,
    totalWeightedPoints: Number(totalWeighted.toFixed(2)),
    totalQualityPoints: Number(totalWeighted.toFixed(2)),
    totalObtainedMarks: totalObtained,
    totalFullMarks: totalFull,
    percentage,
    subjects: evaluated,
    evaluatedSubjects: evaluated,
    hasNG,
    hasNg: hasNG,
    ngCount: ngSubjects.length,
    ngSubjects,
  };
}

export interface TargetExamMarksInput {
  internalMarks?: number;
  internalObtainedMarks?: number;
  internalFullMarks?: number;
  finalFullMarks?: number;
  theoryFullMarks?: number;
  desiredGrade?: string;
  targetGrade?: string;
}

export interface TargetExamMarksResult {
  requiredFinalMarks: number;
  requiredTheoryMarks: number;
  requiredPercentage: number;
  achievable: boolean;
  isPossible: boolean;
  totalPercent: number;
  targetPercentage: number;
  theoryCutoffMarks: number;
  statusMessage: string;
  note: string;
}

/**
 * Calculates required final exam marks given internal marks and desired grade.
 */
export function calculateTargetExamMarks(
  arg1: number | TargetExamMarksInput,
  arg2?: number,
  arg3?: number,
  arg4?: string
): TargetExamMarksResult {
  let internalMarks = 0;
  let internalFullMarks = 25;
  let finalFullMarks = 75;
  let desiredGrade = 'A';

  if (typeof arg1 === 'object' && arg1 !== null) {
    internalMarks = arg1.internalMarks ?? arg1.internalObtainedMarks ?? 0;
    internalFullMarks = arg1.internalFullMarks ?? 25;
    finalFullMarks = arg1.finalFullMarks ?? arg1.theoryFullMarks ?? 75;
    desiredGrade = arg1.desiredGrade ?? arg1.targetGrade ?? 'A';
  } else {
    internalMarks = Number(arg1) || 0;
    internalFullMarks = Number(arg2) || 25;
    finalFullMarks = Number(arg3) || 75;
    desiredGrade = arg4 || 'A';
  }

  const gradeInfo = {
    'A+': 90,
    'A': 80,
    'B+': 70,
    'B': 60,
    'C+': 50,
    'C': 40,
    'D': 35,
  }[desiredGrade] ?? 80;

  const totalFull = internalFullMarks + finalFullMarks;
  const requiredTotal = (gradeInfo / 100) * totalFull;
  const rawNeeded = requiredTotal - internalMarks;
  const minTheoryMarks = (NEB_GRADING_METADATA.theoryPassMinPercent / 100) * finalFullMarks;

  // The student must also pass the theory minimum (35%)
  const effectiveNeeded = Math.max(minTheoryMarks, rawNeeded);
  const roundedNeeded = Math.max(0, Math.ceil(effectiveNeeded));
  const achievable = effectiveNeeded <= finalFullMarks;
  const requiredPercentage = finalFullMarks > 0 ? (roundedNeeded / finalFullMarks) * 100 : 0;

  const note = achievable
    ? `You need at least ${roundedNeeded} out of ${finalFullMarks} in the final exam (and at least ${minTheoryMarks.toFixed(1)} to avoid NG).`
    : `Impossible to achieve ${desiredGrade}. You would need ${Math.ceil(effectiveNeeded)} marks out of ${finalFullMarks}. Maximum possible grade is lower.`;

  return {
    requiredFinalMarks: roundedNeeded,
    requiredTheoryMarks: roundedNeeded,
    requiredPercentage: Number(requiredPercentage.toFixed(1)),
    achievable,
    isPossible: achievable,
    totalPercent: gradeInfo,
    targetPercentage: gradeInfo,
    theoryCutoffMarks: Number(minTheoryMarks.toFixed(1)),
    statusMessage: achievable ? `${roundedNeeded} marks needed` : 'Unattainable',
    note,
  };
}

