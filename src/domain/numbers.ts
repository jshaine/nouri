/**
 * Parses user-typed decimals. Accepts "12", "12.5", "12,5" and surrounding
 * spaces; rejects empty, partial ("1."), signs and anything else.
 */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(normalized)) return null;
  return Number(normalized);
}

/** Rounds for display: whole numbers from 10 up, one decimal below. */
export function roundForDisplay(value: number): number {
  const abs = Math.abs(value);
  return abs >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
}

export function formatNumber(value: number): string {
  return roundForDisplay(value).toLocaleString('en-US');
}
