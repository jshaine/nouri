import { useId, type ReactNode } from 'react';
import {
  calorieSplit,
  formatNumber,
  goalProgress,
  MACROS,
  type DailyGoal,
  type MacroTotals,
} from '@/domain';
import { ProgressBar } from '@/ui';
import { CalorieSplit } from './CalorieSplit';
import { LabelMacroRow } from './LabelMacroRow';
import styles from './NutritionLabel.module.css';

const GRAMS = { protein: 'p', carbs: 'c', fat: 'f' } as const;

export interface NutritionLabelProps {
  totals: MacroTotals;
  goal: DailyGoal | undefined;
  /** Exercise kcal already included in the goal (shown next to it). */
  exerciseKcal?: number;
  /** Shown when there is no goal yet, e.g. a "Set goals" link. */
  noGoalAction?: ReactNode;
}

/** The daily totals, drawn as a nutrition facts label. */
export function NutritionLabel({
  totals,
  goal,
  exerciseKcal = 0,
  noGoalAction,
}: NutritionLabelProps) {
  const titleId = useId();
  const kcal = goal ? goalProgress(totals.kcal, goal.kcal) : undefined;
  return (
    <section className={styles.label} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Daily Facts
      </h2>
      <div className={styles.ruleHeavy} />
      <div className={styles.calories}>
        <span className={styles.caloriesName}>Calories</span>
        <span className={styles.caloriesValue}>{formatNumber(totals.kcal)}</span>
      </div>
      <div className={styles.goalLine}>
        {goal && kcal ? (
          <>
            <span>
              Goal {formatNumber(goal.kcal)}
              {exerciseKcal > 0 && ` (incl. ${formatNumber(exerciseKcal)} exercise)`}
            </span>
            <span>
              {kcal.over > 0
                ? `${formatNumber(kcal.over)} over`
                : `${formatNumber(kcal.remaining)} left`}
            </span>
          </>
        ) : (
          <>
            <span>No goal set yet</span>
            {noGoalAction}
          </>
        )}
      </div>
      {goal && <ProgressBar value={totals.kcal} goal={goal.kcal} />}
      <div className={styles.ruleMedium} />
      {goal && (
        <p className={styles.columnHead} aria-hidden="true">
          % goal
        </p>
      )}
      <ul className={styles.rows}>
        {MACROS.map((m) => (
          <LabelMacroRow key={m} macro={m} grams={totals[GRAMS[m]]} goal={goal?.[GRAMS[m]]} />
        ))}
      </ul>
      <div className={styles.ruleMedium} />
      <CalorieSplit split={calorieSplit(totals)} />
    </section>
  );
}
