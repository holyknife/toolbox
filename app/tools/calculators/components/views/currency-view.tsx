'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import CalculatorHeader from '../primitives/calculator-header';
import ResultPanel from '../primitives/result-panel';
import ResultMetric from '../primitives/result-metric';
import InputField, { SelectField } from '../primitives/input-section';
import FormulaExplanation from '../primitives/formula-explanation';
import BreakdownTable, { type Column } from '../primitives/breakdown-table';
import { getCalculatorBySlug } from '../../registry/calculators-registry';

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', flag: '🇳🇵' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', flag: '🇰🇼' },
];

// Reliable baseline fallback rates normalized to USD (1 USD = X Currency)
const BASE_RATES_USD: Record<string, number> = {
  USD: 1.0,
  NPR: 134.8,
  INR: 83.95,
  EUR: 0.92,
  GBP: 0.77,
  AUD: 1.52,
  CAD: 1.38,
  JPY: 154.2,
  CNY: 7.24,
  AED: 3.6725,
  QAR: 3.64,
  SAR: 3.75,
  SGD: 1.32,
  MYR: 4.42,
  THB: 35.1,
  KRW: 1380.0,
  CHF: 0.88,
  NZD: 1.68,
  KWD: 0.31,
};

export default function CurrencyView() {
  const calculator = getCalculatorBySlug('currency-converter')!;

  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NPR');
  const [rates, setRates] = useState<Record<string, number>>(BASE_RATES_USD);
  const [lastUpdated, setLastUpdated] = useState<string>('Standard Reference');
  const [loading, setLoading] = useState(false);

  // Fetch live exchange rates on mount with offline fallback
  useEffect(() => {
    let cancelled = false;
    async function fetchRates() {
      try {
        setLoading(true);
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (!cancelled && data && data.rates) {
          setRates((prev) => ({ ...prev, ...data.rates }));
          setLastUpdated('Live Market Rates');
        }
      } catch {
        if (!cancelled) {
          setLastUpdated('Standard Reference (Offline)');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRates();
    return () => {
      cancelled = true;
    };
  }, []);

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Convert
  const { convertedAmount, exchangeRate, inverseRate } = useMemo(() => {
    const rateFrom = rates[fromCurrency] || 1;
    const rateTo = rates[toCurrency] || 1;
    // 1 From in To
    const directRate = rateTo / rateFrom;
    const invRate = rateFrom / rateTo;
    const converted = (Number(amount) || 0) * directRate;

    return {
      convertedAmount: converted,
      exchangeRate: directRate,
      inverseRate: invRate,
    };
  }, [amount, fromCurrency, toCurrency, rates]);

  const fromInfo = CURRENCIES.find((c) => c.code === fromCurrency) || {
    code: fromCurrency,
    name: fromCurrency,
    symbol: fromCurrency,
    flag: '🌐',
  };
  const toInfo = CURRENCIES.find((c) => c.code === toCurrency) || {
    code: toCurrency,
    name: toCurrency,
    symbol: toCurrency,
    flag: '🌐',
  };

  // Cheat Sheet Data
  const cheatSheetUnits = [1, 5, 10, 50, 100, 500, 1000];
  const cheatSheetData = cheatSheetUnits.map((u) => ({
    id: u,
    unit: `${fromInfo.symbol} ${u}`,
    converted: `${toInfo.symbol} ${(u * exchangeRate).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  }));

  const cheatColumns: Column<(typeof cheatSheetData)[0]>[] = [
    { header: fromCurrency, accessor: 'unit', align: 'left' },
    { header: toCurrency, accessor: 'converted', align: 'right' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <CalculatorHeader calculator={calculator} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text m-0">Convert Currency</h2>
              <span className="text-xs text-text-dim flex items-center gap-1.5">
                {loading && <RefreshCw size={12} className="animate-spin" />}
                {lastUpdated}
              </span>
            </div>

            <InputField
              label="Amount"
              type="number"
              value={amount}
              onChange={setAmount}
              min={0}
              step="any"
              unit={fromInfo.symbol}
            />

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <SelectField
                label="From Currency"
                value={fromCurrency}
                onChange={setFromCurrency}
                options={CURRENCIES.map((c) => ({
                  label: `${c.flag} ${c.code} - ${c.name}`,
                  value: c.code,
                }))}
              />

              <div className="flex justify-center pb-1">
                <button
                  type="button"
                  onClick={handleSwap}
                  aria-label="Swap currencies"
                  title="Swap currencies"
                  className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-text-dim hover:text-text shadow-xs"
                >
                  <ArrowLeftRight size={16} />
                </button>
              </div>

              <SelectField
                label="To Currency"
                value={toCurrency}
                onChange={setToCurrency}
                options={CURRENCIES.map((c) => ({
                  label: `${c.flag} ${c.code} - ${c.name}`,
                  value: c.code,
                }))}
              />
            </div>
          </div>

          <FormulaExplanation
            title="Current Conversion Rate"
            notes={[
              `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`,
              `1 ${toCurrency} = ${inverseRate.toFixed(4)} ${fromCurrency}`,
              'Exchange rates are indicative mid-market rates without dealer margins or transfer commissions.',
            ]}
          />

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim m-0">
              Quick Conversion Cheat Sheet
            </h3>
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <BreakdownTable columns={cheatColumns} data={cheatSheetData} />
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <ResultPanel
            title={`${amount} ${fromCurrency} =`}
            primaryValue={`${toInfo.symbol} ${convertedAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            primaryUnit={toCurrency}
            statusBadge={{
              label: `1 ${fromCurrency} = ${exchangeRate.toFixed(2)} ${toCurrency}`,
              variant: 'success',
            }}
          >
            <div className="grid grid-cols-2 gap-2 mt-4">
              <ResultMetric
                label="Direct Rate"
                value={`${exchangeRate >= 1 ? exchangeRate.toFixed(2) : exchangeRate.toFixed(4)}`}
                unit={toCurrency}
                highlight="accent"
              />
              <ResultMetric
                label="Inverse Rate"
                value={`${inverseRate >= 1 ? inverseRate.toFixed(2) : inverseRate.toFixed(4)}`}
                unit={fromCurrency}
              />
              <ResultMetric label="From" value={`${fromInfo.flag} ${fromInfo.code}`} />
              <ResultMetric label="To" value={`${toInfo.flag} ${toInfo.code}`} />
            </div>
          </ResultPanel>
        </div>
      </div>
    </div>
  );
}
