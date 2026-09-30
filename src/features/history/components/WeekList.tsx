import { Link } from 'react-router';
import styles from './History.module.css';

export interface ListDay {
  key: string;
  name: string;
  kcal?: string | undefined;
  goal?: string | undefined;
  href: string;
  future: boolean;
}

/** The week as rows: the chart's values in text, each opening its day. */
export function WeekList({ days }: { days: readonly ListDay[] }) {
  return (
    <ul className={styles.list} aria-label="Days">
      {days.map((d) => (
        <li key={d.key}>
          {d.future ? (
            <span className={styles.row}>
              <span>{d.name}</span>
              <span className={styles.muted}>Not yet</span>
            </span>
          ) : (
            <Link to={d.href} className={styles.row}>
              <span>{d.name}</span>
              <span>
                {d.kcal ? <b>{d.kcal}</b> : <span className={styles.muted}>Nothing logged</span>}
                {d.goal && <span className={styles.muted}> / {d.goal}</span>}
              </span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
