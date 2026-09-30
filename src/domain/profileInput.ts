import { isAfter, isLocalDate, type LocalDate } from './dates';
import { parseDecimal } from './numbers';
import { feetInchesToCm, lbToKg, type UnitSystem } from './units';

export const HEIGHT_CM_RANGE = [100, 250] as const;
export const WEIGHT_KG_RANGE = [30, 300] as const;

type Parsed = { ok: true; value: number } | { ok: false; error: string };

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Height from "160" (cm) or feet + inches, always returned in cm. */
export function parseHeight(
  units: UnitSystem,
  text: { cm?: string; ft?: string; in?: string },
): Parsed {
  let cm: number | null;
  if (units === 'metric') {
    cm = parseDecimal(text.cm ?? '');
  } else {
    const ft = parseDecimal(text.ft ?? '');
    const inches = (text.in ?? '').trim() === '' ? 0 : parseDecimal(text.in ?? '');
    cm = ft === null || inches === null ? null : feetInchesToCm(ft, inches);
  }
  const [min, max] = HEIGHT_CM_RANGE;
  if (cm === null || cm < min || cm > max) {
    return {
      ok: false,
      error:
        units === 'metric'
          ? `Enter your height in cm, between ${min} and ${max}.`
          : 'Enter your height in feet and inches, like 5 ft 4 in.',
    };
  }
  return { ok: true, value: round1(cm) };
}

/** A body weight typed in the user's units, returned in kg. */
export function parseBodyWeight(units: UnitSystem, text: string): Parsed {
  const n = parseDecimal(text);
  const kg = n === null ? null : units === 'metric' ? n : lbToKg(n);
  const [min, max] = WEIGHT_KG_RANGE;
  if (kg === null || kg < min || kg > max) {
    return {
      ok: false,
      error: `Enter a weight in ${units === 'metric' ? 'kg, like 62.5' : 'lb, like 138'}.`,
    };
  }
  return { ok: true, value: round1(kg) };
}

export function parseBirthDate(
  text: string,
  today: LocalDate,
): { ok: true; value: LocalDate } | { ok: false; error: string } {
  if (!isLocalDate(text)) return { ok: false, error: 'Pick your birth date.' };
  if (isAfter(text, today)) return { ok: false, error: 'Your birth date can’t be in the future.' };
  return { ok: true, value: text };
}
