import { MACRO_LETTER, MACROS, type Macro } from '@/domain';
import styles from './NutritionLabel.module.css';

/** Where the calories came from: one segmented bar plus P/C/F percentages in text. */
export function CalorieSplit({ split }: { split: Record<Macro, number> }) {
  const empty = MACROS.every((m) => split[m] === 0);
  return (
    <div className={styles.split}>
      <p className={styles.splitTitle}>Calorie split</p>
      {!empty && (
        <div className={styles.splitBar} aria-hidden="true">
          {MACROS.map((m) =>
            split[m] > 0 ? <span key={m} data-macro={m} style={{ flexGrow: split[m] }} /> : null,
          )}
        </div>
      )}
      <ul className={styles.splitLegend}>
        {MACROS.map((m) => (
          <li key={m} data-macro={m}>
            <b>{MACRO_LETTER[m]}</b> {split[m]}%
          </li>
        ))}
      </ul>
    </div>
  );
}
