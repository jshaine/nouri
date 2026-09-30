import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/ui';
import styles from './Weight.module.css';

export interface WeightRow {
  id: string;
  dateLabel: string;
  value: string;
  /** Change from the previous weigh-in, e.g. "−0.4 kg"; neutral, never "bad". */
  change?: string | undefined;
}

interface WeightListProps {
  rows: readonly WeightRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Newest first. Doubles as the chart's table view. */
export function WeightList({ rows, onEdit, onDelete }: WeightListProps) {
  return (
    <ul className={styles.list} aria-label="Weigh-ins">
      {rows.map((r) => (
        <li key={r.id} className={styles.item}>
          <span className={styles.date}>{r.dateLabel}</span>
          <span className={styles.value}>
            <b>{r.value}</b>
            {r.change && <span className={styles.change}> {r.change}</span>}
          </span>
          <span className={styles.tools}>
            <IconButton
              icon={Pencil}
              label={`Edit ${r.dateLabel}`}
              onClick={() => {
                onEdit(r.id);
              }}
            />
            <IconButton
              icon={Trash2}
              label={`Delete ${r.dateLabel}`}
              onClick={() => {
                onDelete(r.id);
              }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
