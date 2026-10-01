import { ageOn, isLocalDate, type LocalDate } from './dates';
import { parseDecimal } from './numbers';
import { feetInchesToCm, lbToKg, type UnitSystem } from './units';

export const HEIGHT_CM_RANGE = [100, 250] as const;
export const WEIGHT_KG_RANGE = [30, 300] as const;
export const AGE_RANGE = [13, 120] as const;

type Parsed = { ok: true; value: number } | { ok: false; error: string };

/** Stored to 0.01 so values typed in lb or ft/in round-trip exactly. */
const round2 = (n: number) => Math.round(n * 100) / 100;

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
  return { ok: true, value: round2(cm) };
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
  return { ok: true, value: round2(kg) };
}

/**
 * The birth date the profile stores for someone who gave only their age: their
 * age today, growing by one each year on today's date. Feb 29 falls back to Feb 28.
 */
export function birthDateForAge(age: number, today: LocalDate): LocalDate {
  const [y, m, d] = today.split('-') as [string, string, string];
  const date = `${String(Number(y) - age).padStart(4, '0')}-${m}-${d}`;
  return isLocalDate(date) ? date : (`${date.slice(0, 8)}28` as LocalDate);
}

/**
 * An age typed in years, as the birth date to store. When `current` (the stored
 * birth date) already gives that age, it is kept, so an exact date isn't lost.
 */
export function parseAge(
  text: string,
  today: LocalDate,
  current?: LocalDate,
): { ok: true; value: LocalDate } | { ok: false; error: string } {
  const n = text.trim() === '' ? null : Number(text.trim());
  const [min, max] = AGE_RANGE;
  if (n === null || !Number.isInteger(n) || n < min || n > max)
    return { ok: false, error: 'Enter your age in years, like 30.' };
  if (current && ageOn(current, today) === n) return { ok: true, value: current };
  return { ok: true, value: birthDateForAge(n, today) };
}
