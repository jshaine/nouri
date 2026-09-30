import type { ButtonHTMLAttributes } from 'react';
import { formatNumber, unitLabel, type Entry } from '@/domain';
import { SourceBadge } from '@/ui';
import styles from './MealSection.module.css';

export type EntryPressProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'className' | 'children'
>;

export interface EntryRowProps {
  entry: Entry;
  /** Tap / long-press handlers; omit for a read-only row. */
  press?: EntryPressProps | undefined;
}

function amountText(entry: Entry): string {
  if (entry.unit.kind === 'grams') return `${formatNumber(entry.amount)} g`;
  const unit = unitLabel(entry.unit);
  return entry.amount === 1 ? unit : `${formatNumber(entry.amount)} × ${unit}`;
}

/** One logged item: name, source, amount, macros and calories. */
export function EntryRow({ entry, press }: EntryRowProps) {
  const { p, c, f, kcal } = entry.totals;
  const content = (
    <>
      <span className={styles.entryMain}>
        <span className={styles.entryName}>
          {entry.name} <SourceBadge source={entry.source} />
        </span>{' '}
        <span className={styles.entryMeta}>
          {amountText(entry)} · P {formatNumber(p)} C {formatNumber(c)} F {formatNumber(f)}
        </span>
      </span>{' '}
      <span className={styles.entryKcal}>
        {formatNumber(kcal)} <span className="visually-hidden">kcal</span>
      </span>
    </>
  );
  return (
    <li>
      {press ? (
        <button type="button" className={styles.entry} {...press}>
          {content}
        </button>
      ) : (
        <div className={styles.entry}>{content}</div>
      )}
    </li>
  );
}
