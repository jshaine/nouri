import { ageOn, type LocalDate } from './dates';
import { birthDateForAge, parseAge, parseBodyWeight, parseHeight } from './profileInput';

describe('parseHeight', () => {
  it('reads centimeters', () => {
    expect(parseHeight('metric', { cm: '160,5' })).toEqual({ ok: true, value: 160.5 });
  });

  it('reads feet and inches (inches optional)', () => {
    expect(parseHeight('imperial', { ft: '5', in: '4' })).toEqual({ ok: true, value: 162.56 });
    expect(parseHeight('imperial', { ft: '6', in: '' })).toEqual({ ok: true, value: 182.88 });
  });

  it.each([
    ['metric', { cm: '' }, /in cm, between 100 and 250/],
    ['metric', { cm: '60' }, /between 100 and 250/],
    ['imperial', { ft: 'x', in: '4' }, /feet and inches/],
    ['imperial', { ft: '5', in: 'x' }, /feet and inches/],
    ['imperial', { ft: '9', in: '0' }, /feet and inches/],
  ] as const)('%s %j → error', (units, text, message) => {
    const r = parseHeight(units, text);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(message);
  });
});

describe('parseBodyWeight', () => {
  it('reads kg and lb, returning kg', () => {
    expect(parseBodyWeight('metric', '65.24')).toEqual({ ok: true, value: 65.24 });
    expect(parseBodyWeight('imperial', '150')).toEqual({ ok: true, value: 68.04 }); // shows as 150 lb
  });

  it.each([
    ['metric', '', /kg, like 62.5/],
    ['metric', '10', /kg/],
    ['imperial', '800', /lb, like 138/],
  ] as const)('%s %j → error', (units, text, message) => {
    const r = parseBodyWeight(units, text);
    expect(!r.ok && r.error).toMatch(message);
  });
});

describe('parseAge', () => {
  const today = '2026-09-30' as LocalDate;
  it('turns an age into a birth date that gives that age today and grows yearly', () => {
    const r = parseAge('30', today);
    expect(r).toEqual({ ok: true, value: '1996-09-30' });
    if (!r.ok) return;
    expect(ageOn(r.value, today)).toBe(30);
    expect(ageOn(r.value, '2027-09-29' as LocalDate)).toBe(30);
    expect(ageOn(r.value, '2027-09-30' as LocalDate)).toBe(31);
  });

  it('keeps an exact birth date that already gives the age', () => {
    expect(parseAge('30', today, '1996-05-01' as LocalDate)).toEqual({
      ok: true,
      value: '1996-05-01',
    });
    expect(parseAge('40', today, '1996-05-01' as LocalDate)).toEqual({
      ok: true,
      value: '1986-09-30',
    });
  });

  it.each(['', 'abc', '12', '30.5', '121'])('%j → error', (text) => {
    expect(parseAge(text, today)).toEqual({
      ok: false,
      error: 'Enter your age in years, like 30.',
    });
  });

  it('moves Feb 29 to Feb 28 in years without it', () => {
    expect(birthDateForAge(30, '2028-02-29' as LocalDate)).toBe('1998-02-28');
  });
});
