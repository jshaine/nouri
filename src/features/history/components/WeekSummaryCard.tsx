import { formatNumber, type MacroTotals } from '@/domain';
import styles from './History.module.css';

interface WeekSummaryCardProps {
  loggedDays: number;
  average: MacroTotals | undefined;
}

/** Days logged, and daily averages over those days. */
export function WeekSummaryCard({ loggedDays, average }: WeekSummaryCardProps) {
  if (!average) {
    return <p className={styles.muted}>Nothing logged this week. Days you log show up here.</p>;
  }
  return (
    <dl className={styles.summary}>
      <div>
        <dt>Days logged</dt>
        <dd>{loggedDays} of 7</dd>
      </div>
      <div>
        <dt>Average per logged day</dt>
        <dd>{formatNumber(average.kcal)} kcal</dd>
      </div>
      <div>
        <dt>Protein · Carbs · Fat</dt>
        <dd>
          {formatNumber(average.p)} g · {formatNumber(average.c)} g · {formatNumber(average.f)} g
        </dd>
      </div>
    </dl>
  );
}
