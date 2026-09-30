import { goalProgress } from './progress';

describe('goalProgress', () => {
  it('fills proportionally under the goal', () => {
    expect(goalProgress(60, 120)).toEqual({
      fill: 0.5,
      overflow: 0,
      remaining: 60,
      over: 0,
      percent: 50,
    });
  });

  it('is exactly full at the goal', () => {
    expect(goalProgress(120, 120)).toMatchObject({ fill: 1, overflow: 0, remaining: 0, over: 0 });
  });

  it('rescales so the overflow segment fits when over', () => {
    const p = goalProgress(150, 100);
    expect(p.fill).toBeCloseTo(2 / 3);
    expect(p.overflow).toBeCloseTo(1 / 3);
    expect(p).toMatchObject({ remaining: 0, over: 50, percent: 150 });
  });

  it('rounds the percent', () => {
    expect(goalProgress(1, 3).percent).toBe(33);
  });

  it.each([0, -5, Number.NaN])('shows nothing for a goal of %s', (goal) => {
    expect(goalProgress(40, goal)).toEqual({
      fill: 0,
      overflow: 0,
      remaining: 0,
      over: 0,
      percent: 0,
    });
  });

  it('treats negative amounts as zero', () => {
    expect(goalProgress(-10, 100)).toMatchObject({ fill: 0, remaining: 100, percent: 0 });
  });
});
