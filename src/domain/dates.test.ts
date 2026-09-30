import {
  addDays,
  ageOn,
  compareDates,
  daysBetween,
  isAfter,
  isLocalDate,
  parseLocalDate,
  startOfLocalDate,
  toLocalDate,
  weekOf,
  type LocalDate,
} from './dates';

const d = (s: string) => parseLocalDate(s);

describe('local dates', () => {
  it('uses the local calendar day, not UTC', () => {
    // 00:30 local on Oct 1 is still Sep 30 in UTC for positive offsets.
    expect(toLocalDate(new Date(2026, 9, 1, 0, 30))).toBe('2026-10-01');
    expect(toLocalDate(new Date(2026, 8, 30, 23, 59))).toBe('2026-09-30');
  });

  it.each(['2026-02-29', '2026-13-01', '2026-1-01', 'today', '', 20260101])('rejects %j', (v) => {
    expect(isLocalDate(v)).toBe(false);
  });

  it('accepts real dates, including leap days', () => {
    expect(isLocalDate('2028-02-29')).toBe(true);
    expect(() => parseLocalDate('2026-02-30')).toThrow(RangeError);
  });

  it('starts at local midnight', () => {
    const start = startOfLocalDate(d('2026-09-30'));
    expect([start.getHours(), start.getMinutes(), start.getDate()]).toEqual([0, 0, 30]);
  });
});

describe('arithmetic', () => {
  it('adds days across months and years', () => {
    expect(addDays(d('2026-12-31'), 1)).toBe('2027-01-01');
    expect(addDays(d('2026-03-01'), -1)).toBe('2026-02-28');
    expect(addDays(d('2026-09-30'), 0)).toBe('2026-09-30');
  });

  it('compares lexically', () => {
    expect(compareDates(d('2026-01-02'), d('2026-01-10'))).toBe(-1);
    expect(compareDates(d('2026-01-10'), d('2026-01-02'))).toBe(1);
    expect(compareDates(d('2026-01-02'), d('2026-01-02'))).toBe(0);
    expect(isAfter(d('2026-10-01'), d('2026-09-30'))).toBe(true);
  });

  it('counts whole days between', () => {
    expect(daysBetween(d('2026-09-16'), d('2026-09-30'))).toBe(14);
    expect(daysBetween(d('2026-09-30'), d('2026-09-16'))).toBe(-14);
  });

  it('builds a Monday-start week', () => {
    const week = weekOf(d('2026-09-30')); // a Wednesday
    expect(week[0]).toBe('2026-09-28');
    expect(week[6]).toBe('2026-10-04');
    expect(weekOf(d('2026-10-04'))[0]).toBe('2026-09-28'); // Sunday stays in the same week
  });
});

describe('ageOn', () => {
  const birth = '2008-10-01' as LocalDate;
  it('counts a birthday only once it has happened', () => {
    expect(ageOn(birth, d('2026-09-30'))).toBe(17);
    expect(ageOn(birth, d('2026-10-01'))).toBe(18);
    expect(ageOn(birth, d('2026-11-15'))).toBe(18);
  });
});
