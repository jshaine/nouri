import {
  cmToFeetInches,
  feetInchesToCm,
  formatHeight,
  formatWeight,
  kgToLb,
  lbToKg,
} from './units';

describe('unit conversions', () => {
  it('converts pounds and kilograms both ways', () => {
    expect(lbToKg(150)).toBeCloseTo(68.039, 3);
    expect(kgToLb(68.039)).toBeCloseTo(150, 2);
  });

  it('converts feet and inches to centimeters', () => {
    expect(feetInchesToCm(5, 4)).toBeCloseTo(162.56, 2);
    expect(feetInchesToCm(6, 0)).toBeCloseTo(182.88, 2);
  });

  it('converts centimeters to feet and inches (to the half inch, carrying)', () => {
    expect(cmToFeetInches(182.88)).toEqual({ feet: 6, inches: 0 });
    expect(cmToFeetInches(160)).toEqual({ feet: 5, inches: 3 }); // 62.99 in
    expect(cmToFeetInches(182.6)).toEqual({ feet: 6, inches: 0 }); // 71.89 in → 72
  });

  it('formats in the chosen units', () => {
    expect(formatWeight(65.24, 'metric')).toBe('65.2 kg');
    expect(formatWeight(65, 'imperial')).toBe('143.3 lb');
    expect(formatHeight(160.4, 'metric')).toBe('160 cm');
    expect(formatHeight(162.56, 'imperial')).toBe('5 ft 4 in');
  });
});
