export interface CalculatorItem {
  id: string;
  slug: string;
  title: string;
  name: string;
  shortTitle: string;
  description: string;
  scope: 'general';
  category: 'Finance' | 'Everyday' | 'Health' | 'Dates & Time' | 'Education';
  routePath: string;
  iconName: string;
  badgeClass: string;
  iconClass: string;
  keywords: string[];
  featured?: boolean;
}

export const CALCULATOR_CATEGORIES = [
  'All',
  'Finance',
  'Everyday',
  'Health',
  'Dates & Time',
  'Education',
] as const;

export type CalculatorCategory = (typeof CALCULATOR_CATEGORIES)[number];

export const calculators: CalculatorItem[] = [
  // 1. Percentage Calculator
  {
    id: 'percentage',
    slug: 'percentage',
    title: 'Percentage Calculator',
    name: 'Percentage Calculator',
    shortTitle: 'Percentage',
    description: 'Find percentage of a number, percentage increase or decrease, and what percent X is of Y.',
    scope: 'general',
    category: 'Everyday',
    routePath: '/tools/calculators/percentage',
    iconName: 'Percent',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    iconClass: 'text-blue-600 dark:text-blue-400',
    keywords: ['percentage', 'percent', 'fraction', 'ratio', 'increase', 'decrease', 'change', 'percent of'],
    featured: true,
  },

  // 2. BMI Calculator
  {
    id: 'bmi',
    slug: 'bmi',
    title: 'BMI Calculator',
    name: 'BMI Calculator',
    shortTitle: 'BMI',
    description: 'Calculate Body Mass Index (BMI) using metric or imperial units and check your healthy weight range.',
    scope: 'general',
    category: 'Health',
    routePath: '/tools/calculators/bmi',
    iconName: 'Activity',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    iconClass: 'text-rose-600 dark:text-rose-400',
    keywords: ['bmi', 'body mass index', 'weight', 'height', 'health', 'fitness', 'obesity', 'underweight'],
    featured: true,
  },

  // 3. Age Calculator
  {
    id: 'age',
    slug: 'age',
    title: 'Age Calculator',
    name: 'Age Calculator',
    shortTitle: 'Age Calculator',
    description: 'Calculate exact age in years, months, and days, along with a countdown to your next birthday.',
    scope: 'general',
    category: 'Dates & Time',
    routePath: '/tools/calculators/age',
    iconName: 'Calendar',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    iconClass: 'text-purple-600 dark:text-purple-400',
    keywords: ['age', 'birthday', 'dob', 'how old am i', 'calendar', 'birth date', 'years old'],
    featured: true,
  },

  // 4. Loan / EMI Calculator
  {
    id: 'loan-emi',
    slug: 'loan-emi',
    title: 'Loan / EMI Calculator',
    name: 'Loan / EMI Calculator',
    shortTitle: 'Loan / EMI',
    description: 'Estimate monthly EMI payments, total interest payable, and full loan repayment schedules.',
    scope: 'general',
    category: 'Finance',
    routePath: '/tools/calculators/loan-emi',
    iconName: 'BadgePercent',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
    keywords: ['loan', 'emi', 'mortgage', 'interest', 'monthly payment', 'bank loan', 'car loan', 'repayment'],
    featured: true,
  },

  // 5. Tip Calculator
  {
    id: 'tip',
    slug: 'tip',
    title: 'Tip Calculator',
    name: 'Tip Calculator',
    shortTitle: 'Tip & Split',
    description: 'Calculate restaurant tips, bill totals, and split payments evenly per person.',
    scope: 'general',
    category: 'Everyday',
    routePath: '/tools/calculators/tip',
    iconName: 'Receipt',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    keywords: ['tip', 'bill splitter', 'gratuity', 'restaurant', 'split bill', 'dinner', 'share'],
  },

  // 6. Discount Calculator
  {
    id: 'discount',
    slug: 'discount',
    title: 'Discount Calculator',
    name: 'Discount Calculator',
    shortTitle: 'Discount',
    description: 'Compute discounted sale prices and total savings from original price and discount percentage.',
    scope: 'general',
    category: 'Everyday',
    routePath: '/tools/calculators/discount',
    iconName: 'Tag',
    badgeClass: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    iconClass: 'text-teal-600 dark:text-teal-400',
    keywords: ['discount', 'sale', 'off', 'savings', 'price', 'shopping', 'promo'],
  },

  // 7. Date Difference Calculator
  {
    id: 'date-difference',
    slug: 'date-difference',
    title: 'Date Difference Calculator',
    name: 'Date Difference Calculator',
    shortTitle: 'Date Difference',
    description: 'Find exact elapsed days, weeks, months, and years between any two calendar dates.',
    scope: 'general',
    category: 'Dates & Time',
    routePath: '/tools/calculators/date-difference',
    iconName: 'CalendarDays',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    iconClass: 'text-sky-600 dark:text-sky-400',
    keywords: ['date difference', 'days between dates', 'duration', 'elapsed time', 'countdown', 'calendar'],
  },

  // 8. GPA Calculator
  {
    id: 'gpa',
    slug: 'gpa',
    title: 'GPA Calculator',
    name: 'GPA Calculator',
    shortTitle: 'GPA Calculator',
    description: 'Credit-weighted semester GPA and cumulative CGPA calculator for college and high school.',
    scope: 'general',
    category: 'Education',
    routePath: '/tools/calculators/gpa',
    iconName: 'GraduationCap',
    badgeClass: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
    iconClass: 'text-orange-600 dark:text-orange-400',
    keywords: ['gpa', 'grade point average', 'cgpa', 'sgpa', 'grades', 'college', 'semester', 'university'],
  },

  // 9. Currency Converter
  {
    id: 'currency-converter',
    slug: 'currency-converter',
    title: 'Currency Converter',
    name: 'Currency Converter',
    shortTitle: 'Currency',
    description: 'Instant conversion between 25+ global and regional currencies with live and offline rates.',
    scope: 'general',
    category: 'Finance',
    routePath: '/tools/calculators/currency-converter',
    iconName: 'Coins',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    keywords: ['currency', 'exchange rate', 'forex', 'money', 'dollar', 'rupee', 'euro', 'npr', 'inr', 'usd'],
    featured: true,
  },
];

export function getCalculatorBySlug(slug: string): CalculatorItem | undefined {
  const normalized = slug.toLowerCase();
  // Support aliases
  if (normalized === 'currency' || normalized === 'forex') {
    return calculators.find((c) => c.slug === 'currency-converter');
  }
  if (normalized === 'bs-ad-age' || normalized === 'dob') {
    return calculators.find((c) => c.slug === 'age');
  }
  if (normalized === 'loan' || normalized === 'emi') {
    return calculators.find((c) => c.slug === 'loan-emi');
  }
  if (normalized === 'percent') {
    return calculators.find((c) => c.slug === 'percentage');
  }
  return calculators.find((c) => c.slug === normalized);
}
