export interface CalculatorItem {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: 'Study & NEB' | 'Money' | 'Nepal' | 'Dates' | 'Everyday' | 'Health' | 'Design';
  iconName: string;
  badgeClass: string;
  iconClass: string;
  keywords: string[];
  featured?: boolean;
  nepalSpecific?: boolean;
  version?: string;
  dataSource?: string;
  lastRuleUpdate?: string;
  relatedCalculators?: string[];
}

export const CALCULATOR_CATEGORIES = [
  'All',
  'Study & NEB',
  'Money',
  'Nepal',
  'Dates',
  'Everyday',
  'Health',
  'Design',
] as const;

export type CalculatorCategory = typeof CALCULATOR_CATEGORIES[number];

export const calculators: CalculatorItem[] = [
  // 1. SEE / Class 10 GPA
  {
    id: 'see-gpa',
    slug: 'see-gpa',
    title: 'SEE / Class 10 GPA Calculator',
    shortTitle: 'SEE GPA Calculator',
    description: 'Calculate your SEE Class 10 GPA with official CDC Letter Grading 2078 rules.',
    category: 'Study & NEB',
    iconName: 'GraduationCap',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40',
    iconClass: 'text-blue-600 dark:text-blue-400',
    keywords: ['see', 'class 10', 'gpa', 'neb', 'cdc', 'grades', 'grade 10', 'marks', 'secondary education'],
    featured: true,
    nepalSpecific: true,
    version: '2078 Directive',
    dataSource: 'National Examinations Board & Curriculum Development Centre',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['see-gpa-planner', 'neb-subject-grade', 'neb-marks-converter'],
  },

  // 2. SEE GPA Planner
  {
    id: 'see-gpa-planner',
    slug: 'see-gpa-planner',
    title: 'SEE Grade / GPA Predictor',
    shortTitle: 'SEE GPA Planner',
    description: 'Experiment with expected marks and see how subject scores impact your overall GPA.',
    category: 'Study & NEB',
    iconName: 'TrendingUp',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    keywords: ['see planner', 'what if', 'target gpa', 'marks needed', 'scenario', 'prediction', 'estimate'],
    featured: true,
    nepalSpecific: true,
    version: '2078 Directive',
    dataSource: 'Curriculum Development Centre Guidelines',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['see-gpa', 'target-marks', 'neb-class-12-planner'],
  },

  // 3. Class 12 NEB GPA
  {
    id: 'neb-class-12-gpa',
    slug: 'neb-class-12-gpa',
    title: 'Class 12 NEB GPA Calculator',
    shortTitle: 'Class 12 GPA',
    description: 'Calculate Class 12 GPA for Science, Management, Humanities with credit weighting.',
    category: 'Study & NEB',
    iconName: 'Award',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    keywords: ['class 12', 'neb', 'plus two', '+2', 'science', 'management', 'humanities', 'gpa', 'credit hours'],
    featured: true,
    nepalSpecific: true,
    version: '2078 Directive',
    dataSource: 'National Examinations Board (NEB)',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['neb-class-12-planner', 'neb-subject-grade', 'see-gpa'],
  },

  // 4. Class 12 GPA Planner
  {
    id: 'neb-class-12-planner',
    slug: 'neb-class-12-planner',
    title: 'Class 12 GPA Predictor & Planner',
    shortTitle: 'Class 12 Planner',
    description: 'Estimate your Class 12 GPA before board results and calculate marks needed for target grade.',
    category: 'Study & NEB',
    iconName: 'BarChart3',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/40',
    iconClass: 'text-purple-600 dark:text-purple-400',
    keywords: ['class 12 planner', '+2 planner', 'neb predictor', 'target grade', 'sensitivity'],
    featured: true,
    nepalSpecific: true,
    version: '2078 Directive',
    dataSource: 'National Examinations Board Guidelines',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['neb-class-12-gpa', 'see-gpa-planner', 'target-marks'],
  },

  // 5. NEB Subject Grade Calculator
  {
    id: 'neb-subject-grade',
    slug: 'neb-subject-grade',
    title: 'NEB Subject Grade Calculator',
    shortTitle: 'Subject Grade',
    description: 'Check single subject grade from theory & practical marks, NG status, and next grade gap.',
    category: 'Study & NEB',
    iconName: 'BookOpen',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40',
    iconClass: 'text-sky-600 dark:text-sky-400',
    keywords: ['subject grade', 'theory', 'practical', 'internal', 'ng', 'letter grade', 'marks away'],
    nepalSpecific: true,
    version: '2078 Directive',
    dataSource: 'Curriculum Development Centre',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['neb-marks-converter', 'target-marks'],
  },

  // 6. NEB Marks / Grade Converter
  {
    id: 'neb-marks-converter',
    slug: 'neb-marks-converter',
    title: 'Percentage to GPA Converter',
    shortTitle: 'Marks to GPA',
    description: 'Convert between marks, percentage, letter grades and grade points under NEB scale.',
    category: 'Study & NEB',
    iconName: 'ArrowLeftRight',
    badgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/60 dark:border-cyan-800/40',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    keywords: ['percentage to gpa', 'gpa to percentage', 'grade converter', 'grade scale table', 'marks to grade'],
    nepalSpecific: true,
    version: '2078 Directive',
    dataSource: 'National Examinations Board',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['neb-subject-grade', 'see-gpa'],
  },

  // 7. Target Marks Calculator
  {
    id: 'target-marks',
    slug: 'target-marks',
    title: 'Target Exam Marks Calculator',
    shortTitle: 'Target Marks',
    description: 'Find the minimum final exam marks needed to secure your target overall grade or percentage.',
    category: 'Study & NEB',
    iconName: 'Target',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40',
    iconClass: 'text-rose-600 dark:text-rose-400',
    keywords: ['target marks', 'exam marks needed', 'final exam', 'internal score', 'required marks'],
    nepalSpecific: true,
    relatedCalculators: ['neb-subject-grade', 'attendance'],
  },

  // 8. Attendance Calculator
  {
    id: 'attendance',
    slug: 'attendance',
    title: 'Attendance Calculator',
    shortTitle: 'Attendance',
    description: 'Calculate your attendance percentage, classes you can safely miss, or classes needed to hit 75%.',
    category: 'Everyday',
    iconName: 'UserCheck',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    keywords: ['attendance', 'college attendance', 'school attendance', 'bunk', 'skip class', '75 percent'],
    relatedCalculators: ['target-marks', 'sgpa-cgpa'],
  },

  // 9. SGPA / CGPA Calculator
  {
    id: 'sgpa-cgpa',
    slug: 'sgpa-cgpa',
    title: 'University SGPA & CGPA Calculator',
    shortTitle: 'SGPA / CGPA',
    description: 'Calculate semester SGPA and cumulative CGPA with credit-weighted university grade points.',
    category: 'Study & NEB',
    iconName: 'Layers',
    badgeClass: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/40',
    iconClass: 'text-violet-600 dark:text-violet-400',
    keywords: ['sgpa', 'cgpa', 'tu', 'ku', 'pu', 'pokhara', 'tribhuvan', 'semester gpa', 'credit points'],
    relatedCalculators: ['neb-class-12-gpa', 'attendance'],
  },

  // 10. Loan / EMI Calculator
  {
    id: 'loan-emi',
    slug: 'loan-emi',
    title: 'Loan / EMI Calculator',
    shortTitle: 'Loan / EMI',
    description: 'Calculate monthly loan EMI, total interest, and reducing-balance amortization schedule.',
    category: 'Money',
    iconName: 'Wallet',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40',
    iconClass: 'text-amber-600 dark:text-amber-400',
    keywords: ['emi', 'loan', 'bank loan', 'home loan', 'vehicle loan', 'amortization', 'interest', 'nepal bank'],
    featured: true,
    relatedCalculators: ['nepal-salary-tax', 'simple-interest', 'compound-interest'],
  },

  // 11. VAT / Tax Calculator
  {
    id: 'vat-tax',
    slug: 'vat-tax',
    title: 'VAT / Tax Calculator',
    shortTitle: 'VAT / Tax',
    description: 'Add or remove VAT/tax with Nepal’s standard 13% rate or your custom tax rate.',
    category: 'Money',
    iconName: 'Receipt',
    badgeClass: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-800/40',
    iconClass: 'text-orange-600 dark:text-orange-400',
    keywords: ['vat', 'tax', '13 percent', 'pan', 'bill', 'add vat', 'remove vat', 'sales tax'],
    nepalSpecific: true,
    version: '13% VAT standard',
    relatedCalculators: ['discount', 'profit-margin', 'nepal-salary-tax'],
  },

  // 12. Discount Calculator
  {
    id: 'discount',
    slug: 'discount',
    title: 'Discount Calculator',
    shortTitle: 'Discount',
    description: 'Find sale price and savings amount, with support for sequential double discounts.',
    category: 'Money',
    iconName: 'Tag',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40',
    iconClass: 'text-amber-600 dark:text-amber-400',
    keywords: ['discount', 'sale', 'dashain offer', 'savings', 'coupon', 'double discount'],
    relatedCalculators: ['vat-tax', 'profit-margin'],
  },

  // 13. Profit / Margin Calculator
  {
    id: 'profit-margin',
    slug: 'profit-margin',
    title: 'Profit Margin Calculator',
    shortTitle: 'Profit Margin',
    description: 'Calculate profit, margin %, and markup % across cost and selling prices.',
    category: 'Money',
    iconName: 'TrendingUp',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    keywords: ['profit', 'margin', 'markup', 'business', 'cost price', 'selling price', 'revenue'],
    relatedCalculators: ['vat-tax', 'discount'],
  },

  // 14. Simple Interest
  {
    id: 'simple-interest',
    slug: 'simple-interest',
    title: 'Simple Interest Calculator',
    shortTitle: 'Simple Interest',
    description: 'Calculate interest earned and maturity amount across days, months, or years.',
    category: 'Money',
    iconName: 'Calculator',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    keywords: ['simple interest', 'ptr/100', 'interest', 'fd', 'fixed deposit', 'annual rate'],
    relatedCalculators: ['compound-interest', 'loan-emi'],
  },

  // 15. Compound Interest
  {
    id: 'compound-interest',
    slug: 'compound-interest',
    title: 'Compound Interest Calculator',
    shortTitle: 'Compound Interest',
    description: 'Estimate wealth growth with compounding frequencies and regular monthly additions.',
    category: 'Money',
    iconName: 'LineChart',
    badgeClass: 'bg-green-50 dark:bg-green-950/40 border-green-200/60 dark:border-green-800/40',
    iconClass: 'text-green-600 dark:text-green-400',
    keywords: ['compound interest', 'investment', 'savings', 'fd', 'monthly deposit', 'sip'],
    relatedCalculators: ['savings-goal', 'simple-interest'],
  },

  // 16. Savings Goal
  {
    id: 'savings-goal',
    slug: 'savings-goal',
    title: 'Savings Goal Calculator',
    shortTitle: 'Savings Goal',
    description: 'Find how long it takes to reach your financial goal or how much you need to save each month.',
    category: 'Money',
    iconName: 'PiggyBank',
    badgeClass: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200/60 dark:border-pink-800/40',
    iconClass: 'text-pink-600 dark:text-pink-400',
    keywords: ['savings goal', 'financial target', 'monthly savings', 'timeline', 'emergency fund'],
    relatedCalculators: ['compound-interest', 'nepal-salary-tax'],
  },

  // 17. Nepal Salary Tax
  {
    id: 'nepal-salary-tax',
    slug: 'nepal-salary-tax',
    title: 'Nepal Salary Tax Calculator',
    shortTitle: 'Nepal Salary Tax',
    description: 'Calculate personal income tax for FY 2081/82 and 2080/81 with PF, CIT, SSF, and insurance deductions.',
    category: 'Nepal',
    iconName: 'Briefcase',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40',
    iconClass: 'text-blue-600 dark:text-blue-400',
    keywords: ['salary tax', 'nepal tax', 'ird', 'income tax act 2058', 'finance act 2081', 'tax slab', 'tds', 'cit', 'pf', 'ssf'],
    nepalSpecific: true,
    version: 'FY 2081/82',
    dataSource: 'Inland Revenue Department (IRD)',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['vat-tax', 'loan-emi'],
  },

  // 18. Nepal Land Unit Converter
  {
    id: 'nepal-land-converter',
    slug: 'nepal-land-converter',
    title: 'Nepal Land Unit Converter',
    shortTitle: 'Land Converter',
    description: 'Convert between Ropani-Aana-Paisa-Daam (Hill) and Bigha-Kattha-Dhur (Terai), Sq Feet and Metres.',
    category: 'Nepal',
    iconName: 'Compass',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    keywords: ['land converter', 'ropani', 'aana', 'paisa', 'daam', 'bigha', 'kattha', 'dhur', 'napi', 'jagga', 'sq ft'],
    nepalSpecific: true,
    version: 'Survey Department Standard',
    dataSource: 'Department of Survey, Nepal',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['tola-gold-converter', 'nepal-electricity-bill'],
  },

  // 19. Tola / Gold Weight Converter
  {
    id: 'tola-gold-converter',
    slug: 'tola-gold-converter',
    title: 'Tola / Gold Weight Converter',
    shortTitle: 'Gold & Tola',
    description: 'Convert gold weights between Tola, Grams, and Kilograms, and estimate jewellery purchase cost.',
    category: 'Nepal',
    iconName: 'Coins',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40',
    iconClass: 'text-amber-600 dark:text-amber-400',
    keywords: ['tola', 'gold', 'sun chandi', 'silver', 'jewellery', 'gram to tola', 'making charges'],
    nepalSpecific: true,
    relatedCalculators: ['nepal-land-converter', 'vat-tax'],
  },

  // 20. BS / AD Age Calculator
  {
    id: 'bs-ad-age',
    slug: 'bs-ad-age',
    title: 'BS / AD Age Calculator',
    shortTitle: 'Age in BS & AD',
    description: 'Find your exact age from date of birth in Bikram Sambat or English AD, plus next birthday countdown.',
    category: 'Dates',
    iconName: 'CalendarHeart',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40',
    iconClass: 'text-rose-600 dark:text-rose-400',
    keywords: ['age calculator', 'bs age', 'bikram sambat age', 'ad age', 'birthday', 'nepali age', 'miti'],
    nepalSpecific: true,
    relatedCalculators: ['date-difference', 'nepal-salary-tax'],
  },

  // 21. Date Difference
  {
    id: 'date-difference',
    slug: 'date-difference',
    title: 'Date Difference Calculator',
    shortTitle: 'Date Difference',
    description: 'Calculate elapsed days, weeks, months, and years between any two dates in BS or AD.',
    category: 'Dates',
    iconName: 'CalendarDays',
    badgeClass: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-800/40',
    iconClass: 'text-orange-600 dark:text-orange-400',
    keywords: ['date difference', 'elapsed days', 'how many days between', 'bs date difference', 'days count'],
    nepalSpecific: true,
    relatedCalculators: ['bs-ad-age', 'attendance'],
  },

  // 22. Trip / Fuel Cost
  {
    id: 'trip-fuel-cost',
    slug: 'trip-fuel-cost',
    title: 'Trip & Fuel Cost Calculator',
    shortTitle: 'Trip & Fuel Cost',
    description: 'Calculate total petrol/diesel required and cost per passenger for vehicle road trips.',
    category: 'Everyday',
    iconName: 'Fuel',
    badgeClass: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/40',
    iconClass: 'text-teal-600 dark:text-teal-400',
    keywords: ['fuel cost', 'petrol price', 'diesel', 'trip cost', 'mileage', 'split fuel', 'travel nepal'],
    relatedCalculators: ['tip', 'nepal-electricity-bill'],
  },

  // 23. Electricity Bill Estimator
  {
    id: 'nepal-electricity-bill',
    slug: 'nepal-electricity-bill',
    title: 'NEA Electricity Bill Estimator',
    shortTitle: 'Electricity Bill',
    description: 'Estimate domestic Nepal Electricity Authority electricity charges based on meter capacity & unit slabs.',
    category: 'Nepal',
    iconName: 'Zap',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40',
    iconClass: 'text-amber-600 dark:text-amber-400',
    keywords: ['nea', 'electricity bill', 'bijuli bill', 'units consumed', '5 ampere', 'tariff slabs', 'nea nepal'],
    nepalSpecific: true,
    version: 'NEA Domestic Tariff 2080',
    dataSource: 'Nepal Electricity Authority',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['trip-fuel-cost', 'nepal-salary-tax'],
  },

  // 24. Tip / Bill Splitter
  {
    id: 'tip',
    slug: 'tip',
    title: 'Tip / Bill Splitter',
    shortTitle: 'Bill Splitter',
    description: 'Split restaurant bills with service charges and tip percentages evenly or by custom shares.',
    category: 'Everyday',
    iconName: 'Users',
    badgeClass: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200/60 dark:border-pink-800/40',
    iconClass: 'text-pink-600 dark:text-pink-400',
    keywords: ['tip', 'bill split', 'restaurant bill', 'service charge', 'food split'],
    relatedCalculators: ['trip-fuel-cost', 'discount'],
  },

  // 25. BMI Calculator
  {
    id: 'bmi',
    slug: 'bmi',
    title: 'BMI Calculator',
    shortTitle: 'BMI Calculator',
    description: 'Adult Body Mass Index screening metric for metric and imperial height/weight measurements.',
    category: 'Health',
    iconName: 'HeartPulse',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40',
    iconClass: 'text-rose-600 dark:text-rose-400',
    keywords: ['bmi', 'body mass index', 'weight', 'height', 'health screening', 'ideal weight'],
    relatedCalculators: ['attendance', 'aspect-ratio'],
  },

  // 26. Aspect Ratio
  {
    id: 'aspect-ratio',
    slug: 'aspect-ratio',
    title: 'Aspect Ratio Calculator',
    shortTitle: 'Aspect Ratio',
    description: 'Resize dimensions proportionally with aspect ratio lock and standard digital presets.',
    category: 'Design',
    iconName: 'Crop',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40',
    iconClass: 'text-sky-600 dark:text-sky-400',
    keywords: ['aspect ratio', '16:9', '4:3', 'image dimensions', 'scale resolution', 'video format'],
    relatedCalculators: ['bmi', 'discount'],
  },
];

const SLUG_ALIASES: Record<string, string> = {
  'nepal-tax': 'nepal-salary-tax',
  'nepal-land': 'nepal-land-converter',
  'tola-gold': 'tola-gold-converter',
  'nepal-electricity': 'nepal-electricity-bill',
  'bsad-age': 'bs-ad-age',
  'vat': 'vat-tax',
  'fuel-cost': 'trip-fuel-cost',
  'basic': 'aspect-ratio', // Fallback for old route
};

/**
 * Quick helper to lookup calculator by slug or alias.
 */
export function getCalculatorBySlug(slug: string): CalculatorItem | undefined {
  const normalized = SLUG_ALIASES[slug] || slug;
  return calculators.find(c => c.slug === normalized || c.id === normalized);
}

