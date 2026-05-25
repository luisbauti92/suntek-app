const bsFormatter = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a number as Bolivian currency (Bs).
 * Uses es-BO locale: dot for thousands, comma for decimals.
 * Example: 1380696 → "Bs 1.380.696,00"
 */
export function formatBs(n: number): string {
  return `Bs ${bsFormatter.format(n)}`;
}

/**
 * Formats a number with es-BO locale separators (no currency prefix).
 * Useful for quantities like meters, units, etc.
 * Example: 1234.5 → "1.234,50"
 */
export function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}
