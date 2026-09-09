import * as math from './calculate';
import { dateDifference } from './dates';

export interface Field { key: string; label: string; value: string; type?: 'date' | 'select'; options?: string[]; min?: number; max?: number }
export interface Result { label: string; value: string | number; suffix?: string }
export interface Calculator {
  slug: string; name: string; description: string; category: string; note: string;
  fields?: Field[]; calculate?: (values: Record<string,string>) => Result[];
}

// Each entry defines one small form. Ordering is intentionally easiest first.
export const calculators: Calculator[] = [
  { slug:'basic',name:'Basic Calculator',description:'Everyday arithmetic with a keypad and keyboard.',category:'Everyday',note:'Supports +, −, ×, ÷, parentheses, and %. A percentage is divided by 100: 200 × 10% = 20.' },
  { slug:'discount',name:'Discount Calculator',description:'Sale price and how much you save.',category:'Everyday',note:'A single discount applied to the original price.',
    fields:[{key:'price',label:'Original price',value:'1000'},{key:'rate',label:'Discount (%)',value:'20',max:100}],
    calculate:v => { const r = math.discount(n(v,'price'),n(v,'rate',100)); return [out('Sale price',r.total),out('You save',r.saved)]; } },
  { slug:'tip',name:'Tip / Bill Splitter',description:'Add a tip and split the total evenly.',category:'Everyday',note:'Tip is based on the entered bill. Per-person amounts round up to the next cent.',
    fields:[{key:'bill',label:'Bill amount',value:'1200'},{key:'rate',label:'Tip (%)',value:'10',max:100},{key:'people',label:'Number of people',value:'3',min:1}],
    calculate:v => { const r = math.tip(n(v,'bill'),n(v,'rate',100),n(v,'people')); return [out('Per person',r.each),out('Tip',r.tip),out('Total bill',r.total)]; } },
  { slug:'tax',name:'GST / VAT Calculator',description:'Fill any two: tax rate, before-tax price, or after-tax price.',category:'Money',note:'Enter the applicable rate or calculate it from the two prices. No country-specific tax rules are assumed. Prices round to two decimal places.' },
  { slug:'profit-margin',name:'Profit Margin Calculator',description:'Compare profit, margin, and markup.',category:'Money',note:'Margin is profit ÷ selling price. Markup is profit ÷ cost. Negative results represent a loss.',
    fields:[{key:'cost',label:'Cost',value:'600'},{key:'price',label:'Selling price',value:'1000'}],
    calculate:v => { const r = math.margin(n(v,'cost'),n(v,'price')); return [out('Profit',r.profit),out('Margin',r.margin,'%'),out('Markup',r.markup === null ? 'Not defined at zero cost' : r.markup,r.markup === null ? '' : '%')]; } },
  { slug:'simple-interest',name:'Simple Interest Calculator',description:'Interest earned on the original amount.',category:'Money',note:'Fixed annual simple interest. No fees, taxes, or additional deposits.',
    fields:[{key:'principal',label:'Principal amount',value:'10000'},{key:'rate',label:'Annual interest (%)',value:'5',max:1000},{key:'years',label:'Time (years)',value:'3',max:1000}],
    calculate:v => { const r = math.simpleInterest(n(v,'principal'),n(v,'rate',1000),n(v,'years',1000)); return [out('Total amount',r.total),out('Interest',r.interest)]; } },
  { slug:'bmi',name:'BMI Calculator',description:'Adult body mass index using metric or imperial units.',category:'Health',note:'Adult categories are for ages 20+. BMI is a screening measure, not a diagnosis; it is not suitable for assessing children or pregnancy.',
    fields:[{key:'units',label:'Units',value:'Metric (kg / cm)',type:'select',options:['Metric (kg / cm)','Imperial (lb / in)']},{key:'weight',label:'Weight (kg or lb)',value:'70',min:0.01},{key:'height',label:'Height (cm or total inches)',value:'175',min:0.01}],
    calculate:v => { const imperial = v.units.startsWith('Imperial'); const r = math.bmi(n(v,'weight') * (imperial ? 0.45359237 : 1),n(v,'height') * (imperial ? 2.54 : 1)); return [out('BMI',r.value),out('Adult category',r.category)]; } },
  { slug:'aspect-ratio',name:'Aspect Ratio Calculator',description:'Reduce dimensions and resize proportionally.',category:'Design',note:'Enter whole pixels for original dimensions. New dimensions may be fractional; round when exporting an image.',
    fields:[{key:'width',label:'Original width (px)',value:'1920',min:1},{key:'height',label:'Original height (px)',value:'1080',min:1},{key:'target',label:'New dimension (px)',value:'1280',min:0.01},{key:'mode',label:'Resize by',value:'Width',type:'select',options:['Width','Height']}],
    calculate:v => { const r = math.aspectRatio(n(v,'width'),n(v,'height'),n(v,'target'),v.mode === 'Width'); return [out('Aspect ratio',r.ratio),out('New width',r.width,'px'),out('New height',r.height,'px')]; } },
  { slug:'date-difference',name:'Date Difference Calculator',description:'Elapsed days and calendar years, months, and days.',category:'Dates',note:'Gregorian dates. End date is excluded from elapsed days. Month anniversaries clamp to the last valid day.',
    fields:[{key:'start',label:'Start date',value:'2024-01-01',type:'date'},{key:'end',label:'End date',value:'today',type:'date'}],
    calculate:v => dateResults(v.start,v.end) },
  { slug:'age',name:'Age Calculator',description:'Exact calendar age on a date you choose.',category:'Dates',note:'Gregorian dates. Leap-day birthdays use the last valid day of February in non-leap years. This is a calendar calculation, not a legal-age determination.',
    fields:[{key:'start',label:'Date of birth',value:'2000-01-01',type:'date'},{key:'end',label:'Age as of',value:'today',type:'date'}],
    calculate:v => dateResults(v.start,v.end) },
  { slug:'compound-interest',name:'Compound Interest Calculator',description:'Estimate growth with interest on interest.',category:'Money',note:'A lump sum at a fixed nominal annual rate. No recurring deposits, tax, fees, or inflation adjustment.',
    fields:[{key:'principal',label:'Starting amount',value:'10000'},{key:'rate',label:'Annual interest (%)',value:'5',max:1000},{key:'years',label:'Time (years)',value:'10',max:1000},{key:'frequency',label:'Compounds per year',value:'12',type:'select',options:['1','2','4','12','365']}],
    calculate:v => { const r = math.compoundInterest(n(v,'principal'),n(v,'rate',1000),n(v,'years',1000),n(v,'frequency')); return [out('Future value',r.total),out('Interest earned',r.interest)]; } },
  { slug:'loan-emi',name:'Loan / EMI Calculator',description:'Monthly payments, interest, and total repayment.',category:'Money',note:'Fixed-rate loan with equal monthly payments. Excludes fees, insurance, taxes, and lender rounding.',
    fields:[{key:'principal',label:'Loan amount',value:'100000'},{key:'rate',label:'Annual interest (%)',value:'10',max:1000},{key:'months',label:'Duration (months)',value:'60',min:1,max:1200}],
    calculate:v => { const r = math.loan(n(v,'principal'),n(v,'rate',1000),n(v,'months',1200)); return [out('Monthly EMI',r.payment),out('Total interest',r.interest),out('Total repayment',r.total)]; } },
  { slug:'gpa',name:'GPA Calculator',description:'Credit-weighted grade points for any numeric scale.',category:'Study',note:'Enter your institution’s grade points and scale; letter-grade mappings vary between schools.' },
  { slug:'grade',name:'Grade Calculator',description:'Weighted grades, final grades, and required exam marks.',category:'Study',note:'Percentages use a 0–100 scale. Required marks assume the final exam is the only remaining assessment.' },
];

// Normalize common numeric fields before their calculator formula is called.
function n(values: Record<string,string>, key: string, maximum = 1e15) {
  return math.numberInput(values[key] || '',key,0,maximum);
}

// Keep results as labelled values so every form uses the same readable output panel.
function out(label: string, value: string | number, suffix = ''): Result { return { label,value,suffix }; }

// Both date tools share the same tested calendar arithmetic.
function dateResults(start: string, end: string): Result[] {
  const r = dateDifference(start,end);
  return [out('Calendar difference',`${r.years} years, ${r.months} months, ${r.days} days`),out('Total elapsed days',r.totalDays),out('Whole calendar months',r.totalMonths)];
}
