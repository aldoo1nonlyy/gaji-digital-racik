// Indonesian PPh 21 TER (Tarif Efektif Rata-Rata) per PP 58/2023 & PMK 168/2023
// Effective 1 January 2024

export type TERCategory = 'A' | 'B' | 'C';

export interface TERBracket {
  maxIncome: number; // Upper limit of bruto (Infinity for highest tier)
  rate: number;      // e.g. 0.0025 for 0.25%
}

// Map PTKP Status to TER Category
export function getTERCategory(ptkpStatus: string): TERCategory {
  const status = ptkpStatus.toUpperCase().trim();
  switch (status) {
    case 'TK/0':
    case 'TK/1':
    case 'K/0':
      return 'A';
    case 'TK/2':
    case 'TK/3':
    case 'K/1':
    case 'K/2':
      return 'B';
    case 'K/3':
      return 'C';
    default:
      return 'A';
  }
}

// PMK 168/2023 TER Kategori A Table
export const TER_A_BRACKETS: TERBracket[] = [
  { maxIncome: 5400000, rate: 0.000 },
  { maxIncome: 5650000, rate: 0.0025 },
  { maxIncome: 5950000, rate: 0.005 },
  { maxIncome: 6300000, rate: 0.0075 },
  { maxIncome: 6750000, rate: 0.010 },
  { maxIncome: 7500000, rate: 0.0125 },
  { maxIncome: 8550000, rate: 0.015 },
  { maxIncome: 9650000, rate: 0.0175 },
  { maxIncome: 10050000, rate: 0.020 },
  { maxIncome: 10350000, rate: 0.0225 },
  { maxIncome: 10700000, rate: 0.025 },
  { maxIncome: 11050000, rate: 0.030 },
  { maxIncome: 11600000, rate: 0.035 },
  { maxIncome: 12500000, rate: 0.040 },
  { maxIncome: 13750000, rate: 0.050 },
  { maxIncome: 15100000, rate: 0.060 },
  { maxIncome: 16950000, rate: 0.070 },
  { maxIncome: 19750000, rate: 0.080 },
  { maxIncome: 24150000, rate: 0.090 },
  { maxIncome: 26450000, rate: 0.100 },
  { maxIncome: 28000000, rate: 0.110 },
  { maxIncome: 30050000, rate: 0.120 },
  { maxIncome: 32400000, rate: 0.130 },
  { maxIncome: 35400000, rate: 0.140 },
  { maxIncome: 39100000, rate: 0.150 },
  { maxIncome: 43850000, rate: 0.160 },
  { maxIncome: 47800000, rate: 0.170 },
  { maxIncome: 51400000, rate: 0.180 },
  { maxIncome: 56300000, rate: 0.190 },
  { maxIncome: 62200000, rate: 0.200 },
  { maxIncome: 68600000, rate: 0.210 },
  { maxIncome: 77500000, rate: 0.220 },
  { maxIncome: 89000000, rate: 0.230 },
  { maxIncome: 101900000, rate: 0.240 },
  { maxIncome: 114000000, rate: 0.250 },
  { maxIncome: 130600000, rate: 0.260 },
  { maxIncome: 150800000, rate: 0.270 },
  { maxIncome: 177300000, rate: 0.280 },
  { maxIncome: 233800000, rate: 0.290 },
  { maxIncome: 363800000, rate: 0.300 },
  { maxIncome: 498700000, rate: 0.310 },
  { maxIncome: 750500000, rate: 0.320 },
  { maxIncome: 1400000000, rate: 0.330 },
  { maxIncome: Infinity, rate: 0.340 },
];

// PMK 168/2023 TER Kategori B Table
export const TER_B_BRACKETS: TERBracket[] = [
  { maxIncome: 6200000, rate: 0.000 },
  { maxIncome: 6500000, rate: 0.0025 },
  { maxIncome: 6850000, rate: 0.005 },
  { maxIncome: 7300000, rate: 0.0075 },
  { maxIncome: 9200000, rate: 0.010 },
  { maxIncome: 10750000, rate: 0.015 },
  { maxIncome: 11250000, rate: 0.020 },
  { maxIncome: 11600000, rate: 0.025 },
  { maxIncome: 12600000, rate: 0.030 },
  { maxIncome: 13600000, rate: 0.040 },
  { maxIncome: 14950000, rate: 0.050 },
  { maxIncome: 16400000, rate: 0.060 },
  { maxIncome: 18450000, rate: 0.070 },
  { maxIncome: 21850000, rate: 0.080 },
  { maxIncome: 26000000, rate: 0.090 },
  { maxIncome: 27700000, rate: 0.100 },
  { maxIncome: 29350000, rate: 0.110 },
  { maxIncome: 31450000, rate: 0.120 },
  { maxIncome: 33950000, rate: 0.130 },
  { maxIncome: 37100000, rate: 0.140 },
  { maxIncome: 41100000, rate: 0.150 },
  { maxIncome: 45800000, rate: 0.160 },
  { maxIncome: 49500000, rate: 0.170 },
  { maxIncome: 53800000, rate: 0.180 },
  { maxIncome: 58500000, rate: 0.190 },
  { maxIncome: 64000000, rate: 0.200 },
  { maxIncome: 71000000, rate: 0.210 },
  { maxIncome: 80000000, rate: 0.220 },
  { maxIncome: 93000000, rate: 0.230 },
  { maxIncome: 109000000, rate: 0.240 },
  { maxIncome: 129000000, rate: 0.250 },
  { maxIncome: 163000000, rate: 0.260 },
  { maxIncome: 211000000, rate: 0.270 },
  { maxIncome: 374000000, rate: 0.280 },
  { maxIncome: 459000000, rate: 0.290 },
  { maxIncome: 555000000, rate: 0.300 },
  { maxIncome: 704000000, rate: 0.310 },
  { maxIncome: 1405000000, rate: 0.320 },
  { maxIncome: Infinity, rate: 0.340 },
];

// PMK 168/2023 TER Kategori C Table
export const TER_C_BRACKETS: TERBracket[] = [
  { maxIncome: 6600000, rate: 0.000 },
  { maxIncome: 6950000, rate: 0.0025 },
  { maxIncome: 7350000, rate: 0.005 },
  { maxIncome: 7800000, rate: 0.0075 },
  { maxIncome: 8850000, rate: 0.010 },
  { maxIncome: 9800000, rate: 0.0125 },
  { maxIncome: 10950000, rate: 0.015 },
  { maxIncome: 11200000, rate: 0.0175 },
  { maxIncome: 12050000, rate: 0.020 },
  { maxIncome: 12950000, rate: 0.030 },
  { maxIncome: 14150000, rate: 0.040 },
  { maxIncome: 15550000, rate: 0.050 },
  { maxIncome: 17050000, rate: 0.060 },
  { maxIncome: 19500000, rate: 0.070 },
  { maxIncome: 22700000, rate: 0.080 },
  { maxIncome: 26600000, rate: 0.090 },
  { maxIncome: 28100000, rate: 0.100 },
  { maxIncome: 30100000, rate: 0.110 },
  { maxIncome: 32600000, rate: 0.120 },
  { maxIncome: 35400000, rate: 0.130 },
  { maxIncome: 38900000, rate: 0.140 },
  { maxIncome: 43000000, rate: 0.150 },
  { maxIncome: 47400000, rate: 0.160 },
  { maxIncome: 51200000, rate: 0.170 },
  { maxIncome: 55800000, rate: 0.180 },
  { maxIncome: 60800000, rate: 0.190 },
  { maxIncome: 66700000, rate: 0.200 },
  { maxIncome: 74500000, rate: 0.210 },
  { maxIncome: 83200000, rate: 0.220 },
  { maxIncome: 95600000, rate: 0.230 },
  { maxIncome: 110000000, rate: 0.240 },
  { maxIncome: 134000000, rate: 0.250 },
  { maxIncome: 169000000, rate: 0.260 },
  { maxIncome: 221000000, rate: 0.270 },
  { maxIncome: 390000000, rate: 0.280 },
  { maxIncome: 463000000, rate: 0.290 },
  { maxIncome: 561000000, rate: 0.300 },
  { maxIncome: 709000000, rate: 0.310 },
  { maxIncome: 1419000000, rate: 0.320 },
  { maxIncome: Infinity, rate: 0.340 },
];

/**
 * Get the exact TER rate according to gross taxable income and PTKP category
 */
export function getTERRate(category: TERCategory, grossIncome: number): number {
  const table = category === 'A' ? TER_A_BRACKETS : category === 'B' ? TER_B_BRACKETS : TER_C_BRACKETS;
  for (const tier of table) {
    if (grossIncome <= tier.maxIncome) {
      return tier.rate;
    }
  }
  return 0.340;
}

