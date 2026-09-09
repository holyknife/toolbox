/** Pure calculator formulas. Amounts use whichever currency the user enters. */

// Reject blank, non-finite, and out-of-range inputs before doing arithmetic.
export function numberInput(value: string, label: string, minimum = 0, maximum = Number.MAX_VALUE): number {
  if (!value.trim()) throw new Error(`Enter ${label.toLowerCase()}.`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  return number;
}

// Reject overflow instead of displaying Infinity as a valid result.
export function finite(value: number): number {
  if (!Number.isFinite(value)) throw new Error('These values produce a result too large to calculate. Try smaller values.');
  return value;
}

// Discount is taken from the original price, never from the reduced price.
export function discount(price: number, percent: number) {
  const saved = price * percent / 100;
  return { saved, total:price - saved };
}

// Keep tax-exclusive and tax-inclusive calculations explicit.
export function tax(amount: number, percent: number, included: boolean) {
  const base = included ? amount / (1 + percent / 100) : amount;
  return { base, tax:base * percent / 100, total:base * (1 + percent / 100) };
}

// Split the final bill evenly; round up each share to avoid leaving an unpaid cent.
export function tip(bill: number, percent: number, people: number) {
  if (!Number.isInteger(people) || people < 1) throw new Error('People must be a whole number of at least 1.');
  const gratuity = bill * percent / 100;
  const total = bill + gratuity;
  return { tip:gratuity, total, each:Math.ceil((total / people - 1e-10) * 100) / 100 };
}

// Margin uses selling price; markup uses cost. They are not interchangeable.
export function margin(cost: number, price: number) {
  if (price <= 0) throw new Error('Selling price must be greater than zero.');
  return { profit:price - cost, margin:(price - cost) / price * 100, markup:cost ? (price - cost) / cost * 100 : null };
}

// Simple interest earns only on principal, with time expressed in years.
export function simpleInterest(principal: number, rate: number, years: number) {
  const interest = finite(principal * rate / 100 * years);
  return { interest, total:finite(principal + interest) };
}

// Compound a lump sum at a fixed nominal annual rate, without extra contributions.
export function compoundInterest(principal: number, rate: number, years: number, frequency: number) {
  const total = finite(principal * Math.pow(1 + rate / 100 / frequency,frequency * years));
  return { total, interest:total - principal };
}

// Fixed-rate, fully amortizing monthly payments; log1p/expm1 stay stable near 0%.
export function loan(principal: number, rate: number, months: number) {
  if (!Number.isInteger(months) || months < 1) throw new Error('Loan duration must be a whole number of months.');
  const monthlyRate = rate / 1200;
  const payment = monthlyRate === 0 ? principal / months : principal * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate));
  const total = finite(payment * months);
  return { payment, total, interest:Math.max(0,total - principal) };
}

// Adult BMI is weight in kilograms divided by squared height in meters.
export function bmi(kilograms: number, centimeters: number) {
  if (kilograms <= 0 || centimeters <= 0) throw new Error('Weight and height must be greater than zero.');
  const value = finite(kilograms / Math.pow(centimeters / 100,2));
  const category = value < 18.5 ? 'Underweight' : value < 25 ? 'Healthy weight' : value < 30 ? 'Overweight' : 'Obesity';
  return { value, category };
}

// Euclid's algorithm reduces integer image dimensions to their simplest ratio.
export function aspectRatio(width: number, height: number, target: number, byWidth: boolean) {
  if (!Number.isFinite(target) || target <= 0) throw new Error('New dimension must be greater than zero.');
  if (![width,height].every(value => Number.isSafeInteger(value) && value > 0)) throw new Error('Original width and height must be positive whole pixels.');
  let first = width;
  let second = height;
  while (second) { const remainder = first % second; first = second; second = remainder; }
  return { ratio:`${width / first}:${height / first}`, width:byWidth ? target : target * width / height, height:byWidth ? target * height / width : target };
}

export interface GradeRow { score: number; weight: number }

// Both GPA and weighted grades are averages weighted by credits or percentages.
export function weightedAverage(rows: GradeRow[], maximum: number) {
  if (!rows.length) throw new Error('Add at least one row.');
  for (const row of rows) {
    if (!Number.isFinite(row.score) || row.score < 0 || row.score > maximum || !Number.isFinite(row.weight) || row.weight <= 0) throw new Error(`Scores must be 0–${maximum}, and weights must be greater than zero.`);
  }
  const weight = rows.reduce((sum,row) => sum + row.weight,0);
  return { value:finite(rows.reduce((sum,row) => sum + row.score * row.weight,0) / weight), weight };
}

// Solve target = current*(1-finalWeight) + finalScore*finalWeight.
export function requiredGrade(current: number, target: number, finalWeight: number) {
  if (finalWeight <= 0 || finalWeight > 100) throw new Error('Final exam weight must be greater than 0 and at most 100%.');
  return (target - current * (1 - finalWeight / 100)) / (finalWeight / 100);
}

// Compute the final grade from the completed coursework and final-exam score.
export function finalGrade(current: number, exam: number, finalWeight: number) {
  return current * (1 - finalWeight / 100) + exam * finalWeight / 100;
}

// Parse arithmetic without eval. A trailing % means divide that number by 100.
export function arithmetic(source: string): number {
  const tokens = source.replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/').match(/(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?|[()+\-*/%]|\S/gi) || [];
  let position = 0;
  function primary(): number {
    let value: number;
    const token = tokens[position++];
    if (token === '+' || token === '-') value = (token === '-' ? -1 : 1) * primary();
    else if (token === '(') {
      value = expression();
      if (tokens[position++] !== ')') throw new Error('Close each opening parenthesis.');
    } else {
      if (!token || !/^(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?$/i.test(token)) throw new Error('Enter numbers and arithmetic operators only.');
      value = Number(token);
    }
    while (tokens[position] === '%') { position++; value /= 100; }
    return finite(value);
  }
  function product(): number {
    let value = primary();
    while (tokens[position] === '*' || tokens[position] === '/') {
      const operator = tokens[position++];
      const next = primary();
      if (operator === '/' && next === 0) throw new Error('Cannot divide by zero.');
      value = operator === '*' ? value * next : value / next;
    }
    return finite(value);
  }
  function expression(): number {
    let value = product();
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++];
      const next = product();
      value = operator === '+' ? value + next : value - next;
    }
    return finite(value);
  }
  if (!source.trim()) throw new Error('Enter a calculation.');
  const result = expression();
  if (position !== tokens.length) throw new Error('Check the operators and parentheses.');
  return result;
}
