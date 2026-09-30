import { formatNumber, MEAL_NAME, totalsOf, type Entry, type Meal } from '@/domain';
import { EntryRow } from './EntryRow';
import styles from './MealSection.module.css';

export interface MealSectionProps {
  meal: Meal;
  entries: readonly Entry[];
  onOpenEntry?: ((entry: Entry) => void) | undefined;
}

/** A meal's entries with its calorie total. */
export function MealSection({ meal, entries, onOpenEntry }: MealSectionProps) {
  const total = totalsOf(entries).kcal;
  return (
    <section className={styles.meal} aria-label={MEAL_NAME[meal]}>
      <header className={styles.header}>
        <h3 className={styles.name}>{MEAL_NAME[meal]}</h3>
        <span className={styles.total}>
          {entries.length > 0 ? `${formatNumber(total)} kcal` : 'Nothing yet'}
        </span>
      </header>
      {entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((e) => (
            <EntryRow key={e.id} entry={e} onOpen={onOpenEntry} />
          ))}
        </ul>
      )}
    </section>
  );
}
