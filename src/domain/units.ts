/** Metric/imperial conversions for body measurements. Storage is always metric. */
export type UnitSystem = 'metric' | 'imperial';

export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * INCHES_PER_FOOT + inches) * CM_PER_INCH;
}

/** Whole feet and inches rounded to 0.5 in, carrying 12 in into a foot. */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const total = Math.round((cm / CM_PER_INCH) * 2) / 2;
  let feet = Math.floor(total / INCHES_PER_FOOT);
  let inches = total - feet * INCHES_PER_FOOT;
  if (inches >= INCHES_PER_FOOT) {
    feet += 1;
    inches -= INCHES_PER_FOOT;
  }
  return { feet, inches };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** A weight for display in the user's units, e.g. "65.2 kg" / "143.7 lb". */
export function formatWeight(kg: number, units: UnitSystem): string {
  return units === 'metric' ? `${round1(kg)} kg` : `${round1(kgToLb(kg))} lb`;
}

export function formatHeight(cm: number, units: UnitSystem): string {
  if (units === 'metric') return `${Math.round(cm)} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet} ft ${inches} in`;
}
