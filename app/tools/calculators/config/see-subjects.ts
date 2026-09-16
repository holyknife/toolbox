export interface SubjectConfig {
  id: string;
  name: string;
  creditHours: number;
  theoryFullMarks: number;
  internalFullMarks: number;
  isElective: boolean;
  defaultTheoryMarks?: number;
  defaultInternalMarks?: number;
}

export const SEE_DEFAULT_SUBJECTS: SubjectConfig[] = [
  {
    id: 'nepali',
    name: 'Compulsory Nepali',
    creditHours: 5,
    theoryFullMarks: 75,
    internalFullMarks: 25,
    isElective: false,
    defaultTheoryMarks: 60,
    defaultInternalMarks: 22,
  },
  {
    id: 'english',
    name: 'Compulsory English',
    creditHours: 5,
    theoryFullMarks: 75,
    internalFullMarks: 25,
    isElective: false,
    defaultTheoryMarks: 62,
    defaultInternalMarks: 23,
  },
  {
    id: 'math',
    name: 'Compulsory Mathematics',
    creditHours: 5,
    theoryFullMarks: 75,
    internalFullMarks: 25,
    isElective: false,
    defaultTheoryMarks: 65,
    defaultInternalMarks: 24,
  },
  {
    id: 'science',
    name: 'Science & Technology',
    creditHours: 5,
    theoryFullMarks: 75,
    internalFullMarks: 25,
    isElective: false,
    defaultTheoryMarks: 58,
    defaultInternalMarks: 23,
  },
  {
    id: 'social',
    name: 'Social Studies',
    creditHours: 5,
    theoryFullMarks: 75,
    internalFullMarks: 25,
    isElective: false,
    defaultTheoryMarks: 60,
    defaultInternalMarks: 22,
  },
  {
    id: 'opt1',
    name: 'Optional I (e.g. Opt Mathematics)',
    creditHours: 4,
    theoryFullMarks: 75,
    internalFullMarks: 25,
    isElective: true,
    defaultTheoryMarks: 64,
    defaultInternalMarks: 23,
  },
  {
    id: 'opt2',
    name: 'Optional II (e.g. Computer Science)',
    creditHours: 4,
    theoryFullMarks: 50,
    internalFullMarks: 50,
    isElective: true,
    defaultTheoryMarks: 42,
    defaultInternalMarks: 46,
  },
];

export const defaultSeeSubjects = SEE_DEFAULT_SUBJECTS.map((s) => ({
  ...s,
  theoryFull: s.theoryFullMarks,
  internalFull: s.internalFullMarks,
}));

export type SeeSubjectConfig = SubjectConfig;

export const SEE_ELECTIVE_PRESETS: { name: string; theoryFull: number; internalFull: number }[] = [
  { name: 'Optional Mathematics', theoryFull: 75, internalFull: 25 },
  { name: 'Computer Science', theoryFull: 50, internalFull: 50 },
  { name: 'Accountancy', theoryFull: 75, internalFull: 25 },
  { name: 'Economics', theoryFull: 75, internalFull: 25 },
  { name: 'Geography', theoryFull: 75, internalFull: 25 },
  { name: 'Agriculture', theoryFull: 50, internalFull: 50 },
  { name: 'Health & Physical Education', theoryFull: 50, internalFull: 50 },
  { name: 'Education', theoryFull: 75, internalFull: 25 },
];

