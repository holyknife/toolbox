import type { SubjectConfig } from './see-subjects';

export interface StreamPreset {
  id: string;
  name: string;
  description: string;
  subjects: SubjectConfig[];
}

export const NEB_CLASS12_STREAMS: StreamPreset[] = [
  {
    id: 'science',
    name: 'Science Stream',
    description: 'Standard NEB Class 12 Science curriculum (Physics, Chemistry, Math/Bio).',
    subjects: [
      { id: 'eng12', name: 'Compulsory English', creditHours: 4, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 58, defaultInternalMarks: 22 },
      { id: 'nep12', name: 'Compulsory Nepali', creditHours: 3, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 60, defaultInternalMarks: 23 },
      { id: 'phy12', name: 'Physics', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 56, defaultInternalMarks: 24 },
      { id: 'che12', name: 'Chemistry', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 54, defaultInternalMarks: 24 },
      { id: 'mat12', name: 'Mathematics', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 62, defaultInternalMarks: 24 },
      { id: 'bio12', name: 'Biology / Computer Science', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: true, defaultTheoryMarks: 59, defaultInternalMarks: 24 },
    ],
  },
  {
    id: 'management',
    name: 'Management Stream',
    description: 'Standard NEB Class 12 Management (Accounting, Economics, Business Studies).',
    subjects: [
      { id: 'eng12m', name: 'Compulsory English', creditHours: 4, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 58, defaultInternalMarks: 22 },
      { id: 'nep12m', name: 'Compulsory Nepali', creditHours: 3, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 60, defaultInternalMarks: 23 },
      { id: 'soc12m', name: 'Social Studies & Life Skills', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 62, defaultInternalMarks: 24 },
      { id: 'acc12m', name: 'Accounting', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 65, defaultInternalMarks: 24 },
      { id: 'eco12m', name: 'Economics', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 57, defaultInternalMarks: 23 },
      { id: 'bst12m', name: 'Business Studies / Computer', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: true, defaultTheoryMarks: 61, defaultInternalMarks: 23 },
    ],
  },
  {
    id: 'humanities',
    name: 'Humanities & Law Stream',
    description: 'Standard NEB Class 12 Humanities & Social Sciences.',
    subjects: [
      { id: 'eng12h', name: 'Compulsory English', creditHours: 4, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 60, defaultInternalMarks: 22 },
      { id: 'nep12h', name: 'Compulsory Nepali', creditHours: 3, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 62, defaultInternalMarks: 23 },
      { id: 'soc12h', name: 'Social Studies & Life Skills', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 64, defaultInternalMarks: 24 },
      { id: 'ele12h1', name: 'Sociology / Major English', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 58, defaultInternalMarks: 23 },
      { id: 'ele12h2', name: 'Mass Communication / Law', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: false, defaultTheoryMarks: 60, defaultInternalMarks: 23 },
      { id: 'ele12h3', name: 'Political Science / Geography', creditHours: 5, theoryFullMarks: 75, internalFullMarks: 25, isElective: true, defaultTheoryMarks: 59, defaultInternalMarks: 23 },
    ],
  },
];
