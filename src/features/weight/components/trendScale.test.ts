import { nearestIndex, niceStep, scaleTrend } from './trendScale';

const box = { width: 320, height: 160, top: 10, right: 10, bottom: 20, left: 40 };

describe('niceStep', () => {
  it('picks round steps for about three gridlines', () => {
    expect(niceStep(3)).toBe(1);
    expect(niceStep(7)).toBe(2.5);
    expect(niceStep(20)).toBe(10);
    expect(niceStep(0)).toBe(0.2);
  });
});

describe('scaleTrend', () => {
  it('maps days across and values up, with the goal inside the range', () => {
    const s = scaleTrend(
      [
        { day: 0, value: 66 },
        { day: 27, value: 65 },
      ],
      58,
      box,
    );
    expect(s.x(0)).toBe(40);
    expect(s.x(27)).toBe(310);
    expect(s.min).toBeLessThanOrEqual(58);
    expect(s.max).toBeGreaterThanOrEqual(66);
    expect(s.y(s.max)).toBe(10);
    expect(s.y(s.min)).toBe(140);
    expect(s.ticks[0]).toBe(s.min);
    expect(s.ticks.at(-1)).toBe(s.max);
  });

  it('centers a single point and pads a flat range', () => {
    const s = scaleTrend([{ day: 0, value: 65 }], undefined, box);
    expect(s.x(0)).toBe(175);
    expect(s.min).toBeLessThan(65);
    expect(s.max).toBeGreaterThan(65);
  });
});

describe('nearestIndex', () => {
  it('snaps to the closest point', () => {
    expect(nearestIndex([10, 50, 90], 62)).toBe(1);
    expect(nearestIndex([10, 50, 90], 200)).toBe(2);
    expect(nearestIndex([10], 0)).toBe(0);
  });
});
