import type { CSSProperties } from 'react';
import { goalProgress, type Macro } from '@/domain';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number;
  goal: number;
  /** Macro color; omit for calories (ink). */
  macro?: Macro;
}

/**
 * Visual-only bar: the numbers it shows must be in adjacent text, so it is
 * hidden from assistive tech. Past the goal, a striped segment shows the
 * overage. It is never red: going over is information, not failure.
 */
export function ProgressBar({ value, goal, macro }: ProgressBarProps) {
  const { fill, overflow } = goalProgress(value, goal);
  const style = { '--fill': fill, '--overflow': overflow } as CSSProperties;
  return (
    <div
      className={styles.track}
      style={style}
      data-macro={macro ?? 'calories'}
      data-over={overflow > 0 ? 'true' : undefined}
      aria-hidden="true"
    >
      <span className={styles.fill} />
      {overflow > 0 && <span className={styles.overflow} />}
    </div>
  );
}
