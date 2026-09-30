/** A calendar day in the user's local time zone, "YYYY-MM-DD". */
export type LocalDate = string & { readonly __brand: 'LocalDate' };

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** The local calendar day of an instant (not UTC: logging at 7 am in Manila is "today"). */
export function toLocalDate(instant: Date): LocalDate {
  return `${pad(instant.getFullYear(), 4)}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}` as LocalDate;
}

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== 'string') return false;
  const match = PATTERN.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function parseLocalDate(value: string): LocalDate {
  if (!isLocalDate(value)) throw new RangeError(`Not a valid date: "${value}"`);
  return value;
}

/** Local midnight of a day, for arithmetic and display. */
export function startOfLocalDate(date: LocalDate): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

/** Calendar arithmetic that stays correct across DST changes. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const d = startOfLocalDate(date);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

/** Negative when a is before b; ISO dates compare lexically. */
export function compareDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isAfter(a: LocalDate, b: LocalDate): boolean {
  return compareDates(a, b) > 0;
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  const ms = startOfLocalDate(b).getTime() - startOfLocalDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Monday-start week containing `date`, as 7 days. */
export function weekOf(date: LocalDate): LocalDate[] {
  const weekday = (startOfLocalDate(date).getDay() + 6) % 7; // Monday = 0
  const monday = addDays(date, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Whole years between a birth date and a day. */
export function ageOn(birthDate: LocalDate, on: LocalDate): number {
  const [by, bm, bd] = birthDate.split('-').map(Number) as [number, number, number];
  const [y, m, d] = on.split('-').map(Number) as [number, number, number];
  const hadBirthday = m > bm || (m === bm && d >= bd);
  return y - by - (hadBirthday ? 0 : 1);
}

/** "Today", "Yesterday", or a short weekday date like "Tue, Sep 29" (with the year if different). */
export function relativeDayLabel(date: LocalDate, today: LocalDate, locale = 'en-US'): string {
  const diff = daysBetween(date, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const d = startOfLocalDate(date);
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return d.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** The day to show: a valid past or current day, else today (no future days). */
export function clampToToday(value: string | null, today: LocalDate): LocalDate {
  if (!value || !isLocalDate(value) || isAfter(value, today)) return today;
  return value;
}

/** A gentle backup reminder after this many days. */
export const BACKUP_REMINDER_DAYS = 14;

/** True when there's data worth keeping and no backup in the last 14 days. */
export function backupDue(lastBackupAt: number | null, now: Date, hasData: boolean): boolean {
  if (!hasData) return false;
  if (lastBackupAt === null) return true;
  return now.getTime() - lastBackupAt > BACKUP_REMINDER_DAYS * 86_400_000;
}
