import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import styles from './History.module.css';

export interface ChartDay {
  key: string;
  weekday: string;
  dayOfMonth: string;
  kcal: number;
  goal?: number | undefined;
  href: string;
  /** e.g. "Mon, Sep 28: 1,840 of 2,000 kcal" */
  label: string;
  future: boolean;
}

/**
 * Daily calories as bars (≤24px, rounded top, square at the baseline) with each
 * day's goal as a tick. Every bar is a link to that day; values are in the
 * list below (the table view), so nothing depends on the chart alone.
 */
export function WeekChart({ days }: { days: readonly ChartDay[] }) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.kcal, d.goal ?? 0))) * 1.1;
  return (
    <ol className={styles.chart} aria-label="Calories by day">
      {days.map((d) => {
        const style = {
          '--bar': d.kcal / max,
          '--goal': d.goal === undefined ? 0 : d.goal / max,
        } as CSSProperties;
        const body = (
          <>
            <span className={styles.plot} style={style} aria-hidden="true">
              {d.kcal > 0 && (
                <span
                  className={styles.bar}
                  data-over={d.goal !== undefined && d.kcal > d.goal ? 'true' : undefined}
                />
              )}
              {d.goal !== undefined && <span className={styles.goalTick} />}
            </span>
            <span className={styles.weekday}>{d.weekday}</span>
            <span className={styles.dayNum}>{d.dayOfMonth}</span>
          </>
        );
        return (
          <li key={d.key} className={styles.column}>
            {d.future ? (
              <span className={styles.day} aria-label={`${d.label}, not yet`}>
                {body}
              </span>
            ) : (
              <Link to={d.href} className={styles.day} aria-label={d.label}>
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
