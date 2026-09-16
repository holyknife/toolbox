import { SQFT_PER_UNIT, type CompoundHill, type CompoundTerai } from '../config/nepal-land-units';

export interface LandConversionResult {
  sqFeet: number;
  sqMetre: number;
  acre: number;
  hectare: number;
  decimalRopani: number;
  decimalBigha: number;
  compoundHill: CompoundHill;
  compoundTerai: CompoundTerai;
  formattedHill: string;
  formattedTerai: string;
}

/**
 * Converts compound Hill system (Ropani, Aana, Paisa, Daam) to total square feet.
 */
export function hillToSqFt(r: number, a: number, p: number, d: number): number {
  return (
    (Math.max(0, r) * SQFT_PER_UNIT.ropani) +
    (Math.max(0, a) * SQFT_PER_UNIT.aana) +
    (Math.max(0, p) * SQFT_PER_UNIT.paisa) +
    (Math.max(0, d) * SQFT_PER_UNIT.daam)
  );
}

/**
 * Converts compound Terai system (Bigha, Kattha, Dhur, Kanwa) to total square feet.
 */
export function teraiToSqFt(b: number, k: number, d: number, kw = 0): number {
  return (
    (Math.max(0, b) * SQFT_PER_UNIT.bigha) +
    (Math.max(0, k) * SQFT_PER_UNIT.kattha) +
    (Math.max(0, d) * SQFT_PER_UNIT.dhur) +
    (Math.max(0, kw) * SQFT_PER_UNIT.kanwa)
  );
}

/**
 * Decomposes square feet into whole Ropani, Aana, Paisa, Daam.
 */
export function sqFtToCompoundHill(sqFt: number): CompoundHill {
  const safeSqFt = Math.max(0, sqFt);
  const ropani = Math.floor(safeSqFt / SQFT_PER_UNIT.ropani);
  let rem = safeSqFt - (ropani * SQFT_PER_UNIT.ropani);

  const aana = Math.floor(rem / SQFT_PER_UNIT.aana);
  rem -= aana * SQFT_PER_UNIT.aana;

  const paisa = Math.floor(rem / SQFT_PER_UNIT.paisa);
  rem -= paisa * SQFT_PER_UNIT.paisa;

  const daam = Number((rem / SQFT_PER_UNIT.daam).toFixed(2));

  return { ropani, aana, paisa, daam };
}

/**
 * Decomposes square feet into whole Bigha, Kattha, Dhur, Kanwa.
 */
export function sqFtToCompoundTerai(sqFt: number): CompoundTerai {
  const safeSqFt = Math.max(0, sqFt);
  const bigha = Math.floor(safeSqFt / SQFT_PER_UNIT.bigha);
  let rem = safeSqFt - (bigha * SQFT_PER_UNIT.bigha);

  const kattha = Math.floor(rem / SQFT_PER_UNIT.kattha);
  rem -= kattha * SQFT_PER_UNIT.kattha;

  const dhur = Math.floor(rem / SQFT_PER_UNIT.dhur);
  rem -= dhur * SQFT_PER_UNIT.dhur;

  const kanwa = Number((rem / SQFT_PER_UNIT.kanwa).toFixed(2));

  return { bigha, kattha, dhur, kanwa };
}

/**
 * Comprehensive land conversion given a total square-feet area.
 */
export function convertFromSqFt(sqFt: number): LandConversionResult {
  const safe = Math.max(0, sqFt);
  const hill = sqFtToCompoundHill(safe);
  const terai = sqFtToCompoundTerai(safe);

  const formattedHill = `${hill.ropani} Ropani - ${hill.aana} Aana - ${hill.paisa} Paisa - ${hill.daam} Daam`;
  const formattedTerai = `${terai.bigha} Bigha - ${terai.kattha} Kattha - ${terai.dhur} Dhur${terai.kanwa > 0 ? ` - ${terai.kanwa} Kanwa` : ''}`;

  return {
    sqFeet: Number(safe.toFixed(2)),
    sqMetre: Number((safe / SQFT_PER_UNIT.sqMetre).toFixed(2)),
    acre: Number((safe / SQFT_PER_UNIT.acre).toFixed(4)),
    hectare: Number((safe / SQFT_PER_UNIT.hectare).toFixed(4)),
    decimalRopani: Number((safe / SQFT_PER_UNIT.ropani).toFixed(4)),
    decimalBigha: Number((safe / SQFT_PER_UNIT.bigha).toFixed(4)),
    compoundHill: hill,
    compoundTerai: terai,
    formattedHill,
    formattedTerai,
  };
}
