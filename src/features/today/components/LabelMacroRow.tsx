import { formatNumber, goalProgress, type Macro } from '@/domain';
import { MacroLabel, ProgressBar } from '@/ui';
import styles from './NutritionLabel.module.css';

interface LabelMacroRowProps {
  macro: Macro;
  grams: number;
  goal: number | undefined;
}

/** "Protein 82 g / 120 g ... 68%" with its bar, and "6 g over" when past the goal. */
export function LabelMacroRow({ macro, grams, goal }: LabelMacroRowProps) {
  const progress = goal ? goalProgress(grams, goal) : undefined;
  return (
    <li className={styles.row}>
      <div className={styles.rowLine}>
        <span>
          <MacroLabel macro={macro} /> <b>{formatNumber(grams)} g</b>
          {goal !== undefined && <span className={styles.muted}> / {formatNumber(goal)} g</span>}
        </span>
        {progress && <b>{progress.percent}%</b>}
      </div>
      {goal !== undefined && <ProgressBar value={grams} goal={goal} macro={macro} />}
      {progress && progress.over > 0 && (
        <p className={styles.over}>{formatNumber(progress.over)} g over</p>
      )}
    </li>
  );
}
