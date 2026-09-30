/** Geometry for the weight trend chart (pure, so it can be tested). */

export interface TrendPoint {
  /** Days since the first point. */
  day: number;
  value: number;
}

export interface Box {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** A readable axis step so there are about 3 gridlines. */
export function niceStep(range: number): number {
  const raw = Math.max(range, 0.5) / 3;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const [step] = [1, 2, 2.5, 5, 10].map((m) => m * mag).filter((s) => s >= raw);
  return step ?? 10 * mag;
}

export function scaleTrend(points: readonly TrendPoint[], goal: number | undefined, box: Box) {
  const values = points.map((p) => p.value).concat(goal === undefined ? [] : [goal]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const step = niceStep(hi - lo);
  const min = Math.floor(lo / step) * step - (hi === lo ? step : 0);
  const max = Math.ceil(hi / step) * step + (hi === lo ? step : 0);
  const lastDay = Math.max(1, ...points.map((p) => p.day));
  const plotW = box.width - box.left - box.right;
  const plotH = box.height - box.top - box.bottom;
  const x = (day: number) => box.left + (points.length === 1 ? plotW / 2 : (day / lastDay) * plotW);
  const y = (v: number) => box.top + (1 - (v - min) / (max - min)) * plotH;
  const ticks: number[] = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { x, y, ticks, min, max };
}

/** Index of the point closest to an x position (the crosshair snaps to dates). */
export function nearestIndex(xs: readonly number[], x: number): number {
  let best = 0;
  xs.forEach((px, i) => {
    if (Math.abs(px - x) < Math.abs((xs[best] ?? 0) - x)) best = i;
  });
  return best;
}
