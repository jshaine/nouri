import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { nearestIndex, scaleTrend, type TrendPoint } from './trendScale';
import styles from './TrendChart.module.css';

const BOX = { width: 320, height: 160, top: 12, right: 12, bottom: 22, left: 36 };

export interface TrendChartProps {
  /** Oldest first, in display units. */
  points: readonly (TrendPoint & { label: string })[];
  goal?: number | undefined;
  unit: string;
  /** Plain-language summary, e.g. "66 kg on Sep 1 to 65 kg on Sep 28". */
  summary: string;
}

/**
 * Weight over time: one 2px line in ink, an end dot, hairline grid, the goal
 * as a labeled rule. A crosshair snaps to the nearest weigh-in; arrow keys do
 * the same. Every value is also in the weight list (the table view).
 */
export function TrendChart({ points, goal, unit, summary }: TrendChartProps) {
  const [active, setActive] = useState(points.length - 1);
  const svgRef = useRef<SVGSVGElement>(null);
  const summaryId = useId();
  const s = scaleTrend(points, goal, BOX);
  const xs = points.map((p) => s.x(p.day));
  const current = points[Math.min(active, points.length - 1)];
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${s.x(p.day)},${s.y(p.value)}`)
    .join(' ');
  const valueText = (i: number) => {
    const p = points[i];
    return p ? `${p.label}: ${p.value} ${unit}` : '';
  };

  const track = (e: PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setActive(nearestIndex(xs, ((e.clientX - rect.left) / rect.width) * BOX.width));
  };
  const onKey = (e: KeyboardEvent) => {
    const next = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: points.length - 1 }[
      e.key
    ];
    if (next === undefined) return;
    e.preventDefault();
    setActive(Math.max(0, Math.min(points.length - 1, next)));
  };

  return (
    <figure className={styles.figure}>
      <div
        className={styles.plot}
        role="slider"
        tabIndex={0}
        aria-label="Weight trend"
        aria-describedby={summaryId}
        aria-valuemin={0}
        aria-valuemax={points.length - 1}
        aria-valuenow={active}
        aria-valuetext={valueText(active)}
        onPointerDown={track}
        onPointerMove={track}
        onKeyDown={onKey}
      >
        <p className={styles.readout} aria-hidden="true">
          {current && (
            <>
              <b>
                {current.value} {unit}
              </b>{' '}
              <span>{current.label}</span>
            </>
          )}
        </p>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${BOX.width} ${BOX.height}`}
          aria-hidden="true"
          className={styles.svg}
        >
          {s.ticks.map((t) => (
            <g key={t}>
              <line
                className={styles.grid}
                x1={BOX.left}
                x2={BOX.width - BOX.right}
                y1={s.y(t)}
                y2={s.y(t)}
              />
              <text
                className={styles.tick}
                x={BOX.left - 6}
                y={s.y(t)}
                dy="0.32em"
                textAnchor="end"
              >
                {t}
              </text>
            </g>
          ))}
          {goal !== undefined && (
            <g>
              <line
                className={styles.goal}
                x1={BOX.left}
                x2={BOX.width - BOX.right}
                y1={s.y(goal)}
                y2={s.y(goal)}
              />
              <text
                className={styles.goalLabel}
                x={BOX.width - BOX.right}
                y={s.y(goal)}
                dy="-0.4em"
                textAnchor="end"
              >
                Goal {goal} {unit}
              </text>
            </g>
          )}
          {points.length > 1 && <path className={styles.line} d={line} />}
          {current && (
            <>
              <line
                className={styles.crosshair}
                x1={s.x(current.day)}
                x2={s.x(current.day)}
                y1={BOX.top}
                y2={BOX.height - BOX.bottom}
              />
              <circle className={styles.dot} cx={s.x(current.day)} cy={s.y(current.value)} r={4} />
            </>
          )}
        </svg>
      </div>
      <figcaption id={summaryId} className={styles.caption}>
        {summary}
      </figcaption>
    </figure>
  );
}
