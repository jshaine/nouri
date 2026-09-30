import { formatNumber, MACROS, type MacroTotals } from '@/domain';
import { MacroLabel } from '@/ui';
import styles from './MacroPreview.module.css';

const GRAMS: Record<(typeof MACROS)[number], keyof MacroTotals> = {
  protein: 'p',
  carbs: 'c',
  fat: 'f',
};

/** Live totals for the chosen amount, in the label style. Announced politely as it changes. */
export function MacroPreview({ totals }: { totals: MacroTotals }) {
  return (
    <section className={styles.preview} aria-label="This amount" aria-live="polite">
      <p className={styles.kcal}>
        <span className={styles.kcalValue}>{formatNumber(totals.kcal)}</span> kcal
      </p>
      <ul className={styles.macros}>
        {MACROS.map((m) => (
          <li key={m}>
            <MacroLabel macro={m} variant="letter" />
            <span>{formatNumber(totals[GRAMS[m]])} g</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
