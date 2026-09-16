export interface CalculatorItem {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  scope: 'general' | 'nepal';
  category: 'Study & NEB' | 'Money' | 'Nepal' | 'Dates' | 'Everyday' | 'Health' | 'Design';
  nepalCategory?: 'education' | 'money-tax' | 'dates-calendar' | 'land-measurement' | 'utilities';
  routePath: string;
  iconName: string;
  badgeClass: string;
  iconClass: string;
  keywords: string[];
  featured?: boolean;
  nepalSpecific?: boolean;
  version?: string;
  ruleVersion?: string;
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

export const NEPAL_SECTIONS = [
  { id: 'education', title: 'Education & NEB', description: 'SEE & NEB Class 12 GPA calculators, planners, grade predictors, and exam tools.' },
  { id: 'money-tax', title: 'Money & Tax', description: 'Nepal salary tax slabs for FY 2081/82, VAT, and financial planning.' },
  { id: 'dates-calendar', title: 'Dates & Calendar', description: 'Bikram Sambat (BS) and English (AD) calendar conversions and age tools.' },
  { id: 'land-measurement', title: 'Land & Measurement', description: 'Official Hill R-A-P-D and Terai B-K-D land units and gold tola conversions.' },
  { id: 'utilities', title: 'Utilities & Everyday', description: 'Nepal Electricity Authority (NEA) bill estimator and fuel travel cost calculator.' },
] as const;

export const calculators: CalculatorItem[] = [
  // ==========================================
  // NEPAL-SPECIFIC CALCULATORS
  // ==========================================

  // 1. SEE / Class 10 GPA
  {
    id: 'see-gpa',
    slug: 'see-gpa',
    title: 'SEE / Class 10 GPA Calculator',
    shortTitle: 'SEE GPA Calculator',
    description: 'Calculate your SEE Class 10 GPA with official CDC Letter Grading 2078 rules.',
    scope: 'nepal',
    category: 'Study & NEB',
    nepalCategory: 'education',
    routePath: '/tools/calculators/nepal/see-gpa',
    iconName: 'GraduationCap',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    iconClass: 'text-blue-600 dark:text-blue-400',
    keywords: ['see', 'class 10', 'gpa', 'neb', 'cdc', 'grades', 'grade 10', 'marks', 'secondary education'],
    featured: true,
    nepalSpecific: true,
    version: '2078 Directive',
    ruleVersion: 'CDC 2078 (35% Theory / 40% Internal)',
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
    scope: 'nepal',
    category: 'Study & NEB',
    nepalCategory: 'education',
    routePath: '/tools/calculators/nepal/see-gpa-planner',
    iconName: 'TrendingUp',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    keywords: ['see planner', 'what if', 'target gpa', 'marks needed', 'scenario', 'prediction', 'estimate'],
    featured: true,
    nepalSpecific: true,
    version: '2078 Directive',
    ruleVersion: 'CDC 2078 Directive',
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
    scope: 'nepal',
    category: 'Study & NEB',
    nepalCategory: 'education',
    routePath: '/tools/calculators/nepal/class-12-gpa',
    iconName: 'Award',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    keywords: ['class 12', 'neb', 'plus two', '+2', 'science', 'management', 'humanities', 'gpa', 'credit hours'],
    featured: true,
    nepalSpecific: true,
    version: '2078 Directive',
    ruleVersion: 'NEB 2078 Directive',
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
    scope: 'nepal',
    category: 'Study & NEB',
    nepalCategory: 'education',
    routePath: '/tools/calculators/nepal/class-12-planner',
    iconName: 'BarChart3',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    iconClass: 'text-purple-600 dark:text-purple-400',
    keywords: ['class 12 planner', '+2 planner', 'neb predictor', 'target grade', 'sensitivity'],
    featured: true,
    nepalSpecific: true,
    version: '2078 Directive',
    ruleVersion: 'NEB 2078 Directive',
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
    scope: 'nepal',
    category: 'Study & NEB',
    nepalCategory: 'education',
    routePath: '/tools/calculators/nepal/neb-subject-grade',
    iconName: 'BookOpen',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    iconClass: 'text-sky-600 dark:text-sky-400',
    keywords: ['subject grade', 'theory', 'practical', 'internal', 'ng', 'letter grade', 'marks away'],
    nepalSpecific: true,
    version: '2078 Directive',
    ruleVersion: 'CDC 2078 Directive',
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
    scope: 'nepal',
    category: 'Study & NEB',
    nepalCategory: 'education',
    routePath: '/tools/calculators/nepal/neb-marks-converter',
    iconName: 'ArrowLeftRight',
    badgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
    keywords: ['percentage to gpa', 'gpa to percentage', 'grade converter', 'grade scale table', 'marks to grade'],
    nepalSpecific: true,
    version: '2078 Directive',
    ruleVersion: 'CDC 2078 Directive',
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
    scope: 'nepal',
    category: 'Study & NEB',
    nepalCategory: 'education',
    routePath: '/tools/calculators/nepal/target-marks',
    iconName: 'Target',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    iconClass: 'text-rose-600 dark:text-rose-400',
    keywords: ['target marks', 'exam marks needed', 'final exam', 'internal score', 'required marks'],
    nepalSpecific: true,
    relatedCalculators: ['neb-subject-grade', 'attendance'],
  },

  // 8. Nepal Salary Tax
  {
    id: 'nepal-salary-tax',
    slug: 'nepal-salary-tax',
    title: 'Nepal Salary Tax Calculator',
    shortTitle: 'Salary Tax',
    description: 'Calculate personal income tax for FY 2081/82 and 2080/81 with PF, CIT, SSF, and insurance deductions.',
    scope: 'nepal',
    category: 'Nepal',
    nepalCategory: 'money-tax',
    routePath: '/tools/calculators/nepal/salary-tax',
    iconName: 'Briefcase',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    iconClass: 'text-blue-600 dark:text-blue-400',
    keywords: ['salary tax', 'nepal tax', 'ird', 'income tax act 2058', 'finance act 2081', 'tax slab', 'tds', 'cit', 'pf', 'ssf'],
    nepalSpecific: true,
    version: 'FY 2081/82',
    ruleVersion: 'Inland Revenue Department Finance Act 2081',
    dataSource: 'Inland Revenue Department (IRD)',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['vat-tax', 'loan-emi'],
  },

  // 9. Nepal Land Unit Converter
  {
    id: 'nepal-land-converter',
    slug: 'nepal-land-converter',
    title: 'Nepal Land Unit Converter',
    shortTitle: 'Land Converter',
    description: 'Convert between Ropani-Aana-Paisa-Daam (Hill) and Bigha-Kattha-Dhur (Terai), Sq Feet and Metres.',
    scope: 'nepal',
    category: 'Nepal',
    nepalCategory: 'land-measurement',
    routePath: '/tools/calculators/nepal/land-units',
    iconName: 'Compass',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    keywords: ['land converter', 'ropani', 'aana', 'paisa', 'daam', 'bigha', 'kattha', 'dhur', 'napi', 'jagga', 'sq ft'],
    nepalSpecific: true,
    version: 'Survey Department Standard',
    ruleVersion: 'Survey Department of Nepal Standard',
    dataSource: 'Department of Survey, Nepal',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['tola-gold-converter', 'nepal-electricity-bill'],
  },

  // 10. Tola / Gold Weight Converter
  {
    id: 'tola-gold-converter',
    slug: 'tola-gold-converter',
    title: 'Tola / Gold Weight Converter',
    shortTitle: 'Gold & Tola',
    description: 'Convert gold weights between Tola, Grams, and Kilograms, and estimate jewellery purchase cost.',
    scope: 'nepal',
    category: 'Nepal',
    nepalCategory: 'land-measurement',
    routePath: '/tools/calculators/nepal/tola-gold',
    iconName: 'Coins',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
    keywords: ['tola', 'gold', 'sun chandi', 'silver', 'jewellery', 'gram to tola', 'making charges'],
    nepalSpecific: true,
    ruleVersion: 'FENEGOSIDA Standard (1 Tola = 11.6638g)',
    relatedCalculators: ['nepal-land-converter', 'vat-tax'],
  },

  // 11. BS / AD Age Calculator
  {
    id: 'bs-ad-age',
    slug: 'bs-ad-age',
    title: 'BS / AD Age Calculator',
    shortTitle: 'Age in BS & AD',
    description: 'Find your exact age from date of birth in Bikram Sambat or English AD, plus next birthday countdown.',
    scope: 'nepal',
    category: 'Dates',
    nepalCategory: 'dates-calendar',
    routePath: '/tools/calculators/nepal/bs-ad-age',
    iconName: 'CalendarHeart',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    iconClass: 'text-rose-600 dark:text-rose-400',
    keywords: ['age calculator', 'bs age', 'bikram sambat age', 'ad age', 'birthday', 'nepali age', 'miti'],
    featured: true,
    nepalSpecific: true,
    ruleVersion: 'Nepal Patro Calendar Dataset',
    relatedCalculators: ['date-difference', 'nepal-salary-tax'],
  },

  // 12. Date Difference (BS / AD)
  {
    id: 'date-difference',
    slug: 'date-difference',
    title: 'Date Difference Calculator',
    shortTitle: 'Date Difference',
    description: 'Calculate elapsed days, weeks, months, and years between any two dates in BS or AD.',
    scope: 'nepal',
    category: 'Dates',
    nepalCategory: 'dates-calendar',
    routePath: '/tools/calculators/nepal/date-difference',
    iconName: 'CalendarDays',
    badgeClass: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
    iconClass: 'text-orange-600 dark:text-orange-400',
    keywords: ['date difference', 'elapsed days', 'how many days between', 'bs date difference', 'days count'],
    nepalSpecific: true,
    relatedCalculators: ['bs-ad-age', 'attendance'],
  },

  // 13. NEA Electricity Bill Estimator
  {
    id: 'nepal-electricity-bill',
    slug: 'nepal-electricity-bill',
    title: 'NEA Electricity Bill Estimator',
    shortTitle: 'Electricity Bill',
    description: 'Estimate domestic Nepal Electricity Authority electricity charges based on meter capacity & unit slabs.',
    scope: 'nepal',
    category: 'Nepal',
    nepalCategory: 'utilities',
    routePath: '/tools/calculators/nepal/electricity-bill',
    iconName: 'Zap',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
    keywords: ['nea', 'electricity bill', 'bijuli bill', 'units consumed', '5 ampere', 'tariff slabs', 'nea nepal'],
    nepalSpecific: true,
    version: 'NEA Domestic Tariff 2080',
    ruleVersion: 'NEA Domestic Tariff 2080',
    dataSource: 'Nepal Electricity Authority',
    lastRuleUpdate: '2026-04',
    relatedCalculators: ['trip-fuel-cost', 'nepal-salary-tax'],
  },

  // 14. Trip / Fuel Cost
  {
    id: 'trip-fuel-cost',
    slug: 'trip-fuel-cost',
    title: 'Trip & Fuel Cost Calculator',
    shortTitle: 'Trip & Fuel Cost',
    description: 'Calculate total petrol/diesel required and cost per passenger for vehicle road trips.',
    scope: 'nepal',
    category: 'Everyday',
    nepalCategory: 'utilities',
    routePath: '/tools/calculators/nepal/fuel-cost',
    iconName: 'Fuel',
    badgeClass: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    iconClass: 'text-teal-600 dark:text-teal-400',
    keywords: ['fuel cost', 'petrol price', 'diesel', 'trip cost', 'mileage', 'split fuel', 'travel nepal'],
    relatedCalculators: ['tip', 'nepal-electricity-bill'],
  },

  // ==========================================
  // GENERAL / UNIVERSAL CALCULATORS
  // ==========================================

  // 15. Loan / EMI Calculator
  {
    id: 'loan-emi',
    slug: 'loan-emi',
    title: 'Loan / EMI Calculator',
    shortTitle: 'Loan / EMI',
    description: 'Calculate monthly loan EMI, total interest, and reducing-balance amortization schedule.',
    scope: 'general',
    category: 'Money',
    routePath: '/tools/calculators/loan-emi',
    iconName: 'Wallet',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
    keywords: ['emi', 'loan', 'bank loan', 'home loan', 'vehicle loan', 'amortization', 'interest', 'monthly payment'],
    featured: true,
    relatedCalculators: ['nepal-salary-tax', 'simple-interest', 'compound-interest'],
  },

  // 16. VAT / Tax Calculator
  {
    id: 'vat-tax',
    slug: 'vat-tax',
    title: 'VAT / Tax Calculator',
    shortTitle: 'VAT / Tax',
    description: 'Add or remove VAT/tax with standard 13% rate or custom rates.',
    scope: 'general',
    category: 'Money',
    routePath: '/tools/calculators/vat-tax',
    iconName: 'Receipt',
    badgeClass: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
    iconClass: 'text-orange-600 dark:text-orange-400',
    keywords: ['vat', 'tax', '13 percent', 'pan', 'bill', 'add vat', 'remove vat', 'sales tax'],
    version: '13% VAT standard',
    relatedCalculators: ['discount', 'profit-margin', 'nepal-salary-tax'],
  },

  // 17. Discount Calculator
  {
    id: 'discount',
    slug: 'discount',
    title: 'Discount Calculator',
    shortTitle: 'Discount',
    description: 'Find sale price and savings amount, with support for sequential double discounts.',
    scope: 'general',
    category: 'Money',
    routePath: '/tools/calculators/discount',
    iconName: 'Tag',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
    keywords: ['discount', 'sale', 'dashain offer', 'savings', 'coupon', 'double discount'],
    relatedCalculators: ['vat-tax', 'profit-margin'],
  },

  // 18. Profit / Margin Calculator
  {
    id: 'profit-margin',
    slug: 'profit-margin',
    title: 'Profit Margin Calculator',
    shortTitle: 'Profit Margin',
    description: 'Calculate profit, margin %, and markup % across cost and selling prices.',
    scope: 'general',
    category: 'Money',
    routePath: '/tools/calculators/profit-margin',
    iconName: 'TrendingUp',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    keywords: ['profit', 'margin', 'markup', 'business', 'cost price', 'selling price', 'revenue'],
    relatedCalculators: ['vat-tax', 'discount'],
  },

  // 19. Simple Interest
  {
    id: 'simple-interest',
    slug: 'simple-interest',
    title: 'Simple Interest Calculator',
    shortTitle: 'Simple Interest',
    description: 'Calculate interest earned and maturity amount across days, months, or years.',
    scope: 'general',
    category: 'Money',
    routePath: '/tools/calculators/simple-interest',
    iconName: 'Calculator',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    keywords: ['simple interest', 'ptr/100', 'interest', 'fd', 'fixed deposit', 'annual rate'],
    relatedCalculators: ['compound-interest', 'loan-emi'],
  },

  // 20. Compound Interest
  {
    id: 'compound-interest',
    slug: 'compound-interest',
    title: 'Compound Interest Calculator',
    shortTitle: 'Compound Interest',
    description: 'Estimate wealth growth with compounding frequencies and regular monthly additions.',
    scope: 'general',
    category: 'Money',
    routePath: '/tools/calculators/compound-interest',
    iconName: 'LineChart',
    badgeClass: 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400',
    iconClass: 'text-green-600 dark:text-green-400',
    keywords: ['compound interest', 'investment', 'savings', 'fd', 'monthly deposit', 'sip'],
    relatedCalculators: ['savings-goal', 'simple-interest'],
  },

  // 21. Savings Goal
  {
    id: 'savings-goal',
    slug: 'savings-goal',
    title: 'Savings Goal Calculator',
    shortTitle: 'Savings Goal',
    description: 'Find how long it takes to reach your financial goal or how much you need to save each month.',
    scope: 'general',
    category: 'Money',
    routePath: '/tools/calculators/savings-goal',
    iconName: 'PiggyBank',
    badgeClass: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400',
    iconClass: 'text-pink-600 dark:text-pink-400',
    keywords: ['savings goal', 'financial target', 'monthly savings', 'timeline', 'emergency fund'],
    relatedCalculators: ['compound-interest', 'nepal-salary-tax'],
  },

  // 22. Attendance Calculator
  {
    id: 'attendance',
    slug: 'attendance',
    title: 'Attendance Calculator',
    shortTitle: 'Attendance',
    description: 'Calculate your attendance percentage, classes you can safely miss, or classes needed to hit 75%.',
    scope: 'general',
    category: 'Everyday',
    routePath: '/tools/calculators/attendance',
    iconName: 'UserCheck',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    keywords: ['attendance', 'college attendance', 'school attendance', 'bunk', 'skip class', '75 percent'],
    relatedCalculators: ['target-marks', 'sgpa-cgpa'],
  },

  // 23. SGPA / CGPA Calculator
  {
    id: 'sgpa-cgpa',
    slug: 'sgpa-cgpa',
    title: 'University SGPA & CGPA Calculator',
    shortTitle: 'SGPA / CGPA',
    description: 'Calculate semester SGPA and cumulative CGPA with credit-weighted university grade points.',
    scope: 'general',
    category: 'Study & NEB',
    routePath: '/tools/calculators/sgpa-cgpa',
    iconName: 'Layers',
    badgeClass: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
    iconClass: 'text-violet-600 dark:text-violet-400',
    keywords: ['sgpa', 'cgpa', 'tu', 'ku', 'pu', 'pokhara', 'tribhuvan', 'semester gpa', 'credit points'],
    relatedCalculators: ['neb-class-12-gpa', 'attendance'],
  },

  // 24. Tip / Bill Splitter
  {
    id: 'tip',
    slug: 'tip',
    title: 'Tip / Bill Splitter',
    shortTitle: 'Bill Splitter',
    description: 'Split restaurant bills with service charges and tip percentages evenly or by custom shares.',
    scope: 'general',
    category: 'Everyday',
    routePath: '/tools/calculators/tip',
    iconName: 'Users',
    badgeClass: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400',
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
    scope: 'general',
    category: 'Health',
    routePath: '/tools/calculators/bmi',
    iconName: 'HeartPulse',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
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
    scope: 'general',
    category: 'Design',
    routePath: '/tools/calculators/aspect-ratio',
    iconName: 'Crop',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    iconClass: 'text-sky-600 dark:text-sky-400',
    keywords: ['aspect ratio', '16:9', '4:3', 'image dimensions', 'scale resolution', 'video format'],
    relatedCalculators: ['bmi', 'discount'],
  },
];

const SLUG_ALIASES: Record<string, string> = {
  // Nepal route shortcuts
  'salary-tax': 'nepal-salary-tax',
  'nepal-tax': 'nepal-salary-tax',
  'land-units': 'nepal-land-converter',
  'nepal-land': 'nepal-land-converter',
  'tola-gold': 'tola-gold-converter',
  'gold-tola': 'tola-gold-converter',
  'electricity-bill': 'nepal-electricity-bill',
  'nepal-electricity': 'nepal-electricity-bill',
  'bsad-age': 'bs-ad-age',
  'class-12-gpa': 'neb-class-12-gpa',
  'class-12-planner': 'neb-class-12-planner',
  'vat': 'vat-tax',
  'fuel-cost': 'trip-fuel-cost',
  'basic': 'aspect-ratio', // Fallback for old route
};

/**
 * Lookup calculator by slug or alias.
 */
export function getCalculatorBySlug(slug: string): CalculatorItem | undefined {
  const normalized = SLUG_ALIASES[slug] || slug;
  return calculators.find(c => c.slug === normalized || c.id === normalized);
}

/**
 * Filter calculators by scope.
 */
export function getGeneralCalculators(): CalculatorItem[] {
  return calculators.filter(c => c.scope === 'general');
}

export function getNepalCalculators(): CalculatorItem[] {
  return calculators.filter(c => c.scope === 'nepal');
}

/**
 * Group Nepal calculators by section.
 */
export function getNepalCalculatorsBySection() {
  return NEPAL_SECTIONS.map(section => ({
    ...section,
    items: calculators.filter(c => c.scope === 'nepal' && c.nepalCategory === section.id),
  }));
}
