import { formatNumber, parseDecimal, roundForDisplay } from './numbers';

describe('parseDecimal', () => {
  it.each([
    ['12', 12],
    ['12.5', 12.5],
    ['12,5', 12.5],
    [' 0 ', 0],
    ['.5', 0.5],
  ])('parses %j', (text, value) => {
    expect(parseDecimal(text)).toBe(value);
  });

  it.each(['', ' ', '1.', '-1', '+1', '1e3', 'abc', '1.2.3', '1,2,3'])('rejects %j', (text) => {
    expect(parseDecimal(text)).toBeNull();
  });
});

describe('display rounding', () => {
  it('shows whole numbers from 10 and one decimal below', () => {
    expect(roundForDisplay(205.4)).toBe(205);
    expect(roundForDisplay(4.266)).toBe(4.3);
    expect(roundForDisplay(-12.6)).toBe(-13);
    expect(formatNumber(1240.2)).toBe('1,240');
    expect(formatNumber(0.47)).toBe('0.5');
  });
});
