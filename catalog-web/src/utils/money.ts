const BOB = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMBER = new Intl.NumberFormat('es-BO', {
  maximumFractionDigits: 2,
});

export function formatBob(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  return BOB.format(amount);
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return NUMBER.format(value);
}
