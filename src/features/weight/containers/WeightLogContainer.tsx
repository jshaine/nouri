import type { WeightRepository } from '@/data';
import {
  formatWeight,
  kgToLb,
  relativeDayLabel,
  daysBetween,
  type LocalDate,
  type UnitSystem,
  type WeightEntry,
} from '@/domain';
import { Button } from '@/ui';
import { TrendChart } from '../components/TrendChart';
import { WeightForm } from '../components/WeightForm';
import { WeightList, type WeightRow } from '../components/WeightList';
import { useWeightLog } from '../hooks/useWeightLog';
import styles from '../components/Weight.module.css';

export interface WeightLogContainerProps {
  weights: readonly WeightEntry[];
  repo: Pick<WeightRepository, 'set' | 'update' | 'remove'>;
  units: UnitSystem;
  goalKg?: number | undefined;
  today: LocalDate;
  onLogged?: (entry: WeightEntry) => void;
}

const shown = (kg: number, units: UnitSystem) =>
  Math.round((units === 'metric' ? kg : kgToLb(kg)) * 10) / 10;

export function WeightLogContainer({
  weights,
  repo,
  units,
  goalKg,
  today,
  onLogged,
}: WeightLogContainerProps) {
  const log = useWeightLog(repo, units, today, onLogged);
  const unit = units === 'metric' ? 'kg' : 'lb';
  const label = (d: LocalDate) => relativeDayLabel(d, today);
  const first = weights[0];
  const last = weights.at(-1);

  const rows: WeightRow[] = [...weights].reverse().map((w, i, desc) => {
    const prev = desc[i + 1];
    const diff = prev ? shown(w.kg, units) - shown(prev.kg, units) : 0;
    return {
      id: w.id,
      dateLabel: label(w.date),
      value: formatWeight(w.kg, units),
      change: prev
        ? `${diff > 0 ? '+' : diff < 0 ? '−' : '±'}${Math.abs(Math.round(diff * 10) / 10)} ${unit}`
        : undefined,
    };
  });

  return (
    <div className={styles.form}>
      {log.editing ? (
        <WeightForm
          unit={unit}
          today={today}
          weight={log.editing.weight}
          date={log.editing.date}
          error={log.editing.error}
          submitLabel="Save weight"
          onWeight={(v) => {
            log.editField('weight', v);
          }}
          onDate={(v) => {
            log.editField('date', v);
          }}
          onSubmit={() => {
            void log.saveEdit();
          }}
          onCancel={log.cancelEdit}
        />
      ) : (
        <WeightForm
          unit={unit}
          today={today}
          weight={log.weight}
          date={log.date}
          error={log.error}
          submitLabel="Log weight"
          onWeight={log.setWeight}
          onDate={log.setDate}
          onSubmit={() => {
            void log.log();
          }}
        />
      )}
      {log.failed && (
        <p className={styles.change} role="alert">
          {log.failed}
        </p>
      )}
      {log.removed && (
        <p className={styles.status} role="status">
          Deleted {label(log.removed.date)}.
          <Button
            variant="ghost"
            onClick={() => {
              void log.undo();
            }}
          >
            Undo
          </Button>
        </p>
      )}
      {first && last && (
        <TrendChart
          unit={unit}
          goal={goalKg === undefined ? undefined : shown(goalKg, units)}
          points={weights.map((w) => ({
            day: daysBetween(first.date, w.date),
            value: shown(w.kg, units),
            label: label(w.date),
          }))}
          summary={
            weights.length === 1
              ? `One weigh-in: ${formatWeight(last.kg, units)}. Log another to see a trend.`
              : `From ${formatWeight(first.kg, units)} (${label(first.date)}) to ${formatWeight(last.kg, units)} (${label(last.date)}).`
          }
        />
      )}
      {rows.length > 0 ? (
        <WeightList
          rows={rows}
          onEdit={(id) => {
            const w = weights.find((x) => x.id === id);
            if (w) log.startEdit(w);
          }}
          onDelete={(id) => {
            const w = weights.find((x) => x.id === id);
            if (w) void log.remove(w);
          }}
        />
      ) : (
        <p className={styles.date}>Log your weight to track your trend and get suggested goals.</p>
      )}
    </div>
  );
}
