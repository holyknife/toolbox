/**
 * Official land measurement conversion rates in Nepal.
 * Survey Department (Napi Bibhag) / Ministry of Land Management.
 */

// Square feet equivalents for each unit
export const SQFT_PER_UNIT = {
  // Hill system (R-A-P-D)
  ropani: 5476,
  aana: 342.25,
  paisa: 85.5625,
  daam: 21.390625,

  // Terai system (B-K-D)
  bigha: 72900,
  kattha: 3645,
  dhur: 182.25,
  kanwa: 11.390625,

  // International / Metric
  sqFeet: 1,
  sqMetre: 10.76391041671,
  acre: 43560,
  hectare: 107639.1041671,
};

export interface CompoundHill {
  ropani: number;
  aana: number;
  paisa: number;
  daam: number;
}

export interface CompoundTerai {
  bigha: number;
  kattha: number;
  dhur: number;
  kanwa: number;
}
