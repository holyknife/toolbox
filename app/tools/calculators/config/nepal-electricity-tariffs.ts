export interface TariffSlab {
  minUnits: number;
  maxUnits: number; // inclusive
  energyRate: number; // Rs per unit
  minCharge: number; // minimum / service charge for this tier
}

export interface ElectricityTariffConfig {
  source: string;
  sourceUrl: string;
  lastVerified: string;
  effectiveDate: string;
  amperageOptions: { id: string; label: string; slabs: TariffSlab[] }[];
}

export const NEA_DOMESTIC_TARIFF: ElectricityTariffConfig = {
  source: 'Nepal Electricity Authority (NEA) Consumer Tariff Directive',
  sourceUrl: 'https://nea.org.np',
  lastVerified: '2026-04-15',
  effectiveDate: '2080 B.S.',
  amperageOptions: [
    {
      id: '5A',
      label: '5 Ampere (Standard Domestic)',
      slabs: [
        { minUnits: 0,   maxUnits: 20,  energyRate: 0.0, minCharge: 30 },
        { minUnits: 21,  maxUnits: 30,  energyRate: 6.5, minCharge: 50 },
        { minUnits: 31,  maxUnits: 50,  energyRate: 8.0, minCharge: 50 },
        { minUnits: 51,  maxUnits: 100, energyRate: 9.5, minCharge: 75 },
        { minUnits: 101, maxUnits: 250, energyRate: 9.5, minCharge: 100 },
        { minUnits: 251, maxUnits: 400, energyRate: 11.0, minCharge: 125 },
        { minUnits: 401, maxUnits: Infinity, energyRate: 12.0, minCharge: 150 },
      ],
    },
    {
      id: '15A',
      label: '15 Ampere',
      slabs: [
        { minUnits: 0,   maxUnits: 20,  energyRate: 4.0, minCharge: 50 },
        { minUnits: 21,  maxUnits: 30,  energyRate: 6.5, minCharge: 75 },
        { minUnits: 31,  maxUnits: 50,  energyRate: 8.0, minCharge: 75 },
        { minUnits: 51,  maxUnits: 100, energyRate: 9.5, minCharge: 100 },
        { minUnits: 101, maxUnits: 250, energyRate: 9.5, minCharge: 125 },
        { minUnits: 251, maxUnits: 400, energyRate: 11.0, minCharge: 150 },
        { minUnits: 401, maxUnits: Infinity, energyRate: 12.0, minCharge: 175 },
      ],
    },
    {
      id: '30A',
      label: '30 Ampere',
      slabs: [
        { minUnits: 0,   maxUnits: 50,  energyRate: 8.5, minCharge: 125 },
        { minUnits: 51,  maxUnits: 100, energyRate: 10.0, minCharge: 150 },
        { minUnits: 101, maxUnits: 250, energyRate: 10.0, minCharge: 175 },
        { minUnits: 251, maxUnits: 400, energyRate: 11.5, minCharge: 200 },
        { minUnits: 401, maxUnits: Infinity, energyRate: 12.5, minCharge: 225 },
      ],
    },
    {
      id: '60A',
      label: '60 Ampere (3-Phase / Heavy Domestic)',
      slabs: [
        { minUnits: 0,   maxUnits: 100, energyRate: 10.5, minCharge: 200 },
        { minUnits: 101, maxUnits: 250, energyRate: 10.5, minCharge: 225 },
        { minUnits: 251, maxUnits: 400, energyRate: 12.0, minCharge: 250 },
        { minUnits: 401, maxUnits: Infinity, energyRate: 13.0, minCharge: 275 },
      ],
    },
  ],
};
