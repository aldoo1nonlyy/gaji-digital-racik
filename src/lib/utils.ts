import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to Indonesian Rupiah standard (Rp X.XXX.XXX)
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.round(Math.abs(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);

  // Intl formats as "Rp 12.500.000" or "Rp12.500.000"
  const clean = formatted.replace(/\u00A0/g, ' ').replace('IDR', 'Rp');
  return isNegative ? `-${clean}` : clean;
}

/**
 * Format date string into Indonesian readable format (e.g., 25 Oktober 2026)
 */
export function formatDateIndo(dateInput: string | Date | null | undefined, includeDay: boolean = false): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeDay ? { weekday: 'long' } : {}),
  };

  return new Intl.DateTimeFormat('id-ID', options).format(date);
}

/**
 * Convert number to Indonesian "Terbilang" words
 * e.g., 12500000 -> "Dua Belas Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(nominal: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  function convert(n: number): string {
    n = Math.floor(Math.abs(n));
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return convert(n - 10) + ' Belas';
    } else if (n < 100) {
      return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
    } else if (n < 200) {
      return 'Seratus ' + convert(n - 100);
    } else if (n < 1000) {
      return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
    } else if (n < 2000) {
      return 'Seribu ' + convert(n - 1000);
    } else if (n < 1000000) {
      return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
    } else if (n < 1000000000) {
      return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
    } else if (n < 1000000000000) {
      return convert(Math.floor(n / 1000000000)) + ' Miliar ' + convert(n % 1000000000);
    } else {
      return convert(Math.floor(n / 1000000000000)) + ' Triliun ' + convert(n % 1000000000000);
    }
  }

  if (nominal === 0) return 'Nol Rupiah';
  const result = convert(nominal).replace(/\s+/g, ' ').trim();
  return `${result} Rupiah`;
}

// Office Geofence Coordinates: SCBD Jakarta
export const OFFICE_COORDS = {
  name: 'Head Office SCBD Jakarta',
  latitude: -6.2255,
  longitude: 106.8095,
  radiusMeters: 250, // 250m radius
};

/**
 * Calculate distance in meters between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

