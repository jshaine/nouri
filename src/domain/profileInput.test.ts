import type { LocalDate } from './dates';
import { parseBirthDate, parseBodyWeight, parseHeight } from './profileInput';

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

describe('parseBirthDate', () => {
  const today = '2026-09-30' as LocalDate;
  it('accepts past dates and rejects future or invalid ones', () => {
    expect(parseBirthDate('1996-05-01', today)).toEqual({ ok: true, value: '1996-05-01' });
    expect(parseBirthDate('2027-01-01', today)).toEqual({
      ok: false,
      error: 'Your birth date can’t be in the future.',
    });
    expect(parseBirthDate('', today)).toEqual({ ok: false, error: 'Pick your birth date.' });
  });
});
