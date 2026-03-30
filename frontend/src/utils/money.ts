/** Two decimal places for Bs and dimension inputs in the UI. */
export function roundMoney2(value: number): number {
  const n = Number.isFinite(value) ? value : 0;
  return Math.round(n * 100) / 100;
}
