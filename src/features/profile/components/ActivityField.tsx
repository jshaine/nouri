import { useId } from 'react';
import { ACTIVITY_LEVELS, type ActivityLevel } from '@/domain';
import styles from './Profile.module.css';

interface ActivityFieldProps {
  value: ActivityLevel | undefined;
  onChange: (level: ActivityLevel) => void;
}

/** Daily-life activity (not workouts), as radio cards with examples. */
export function ActivityField({ value, onChange }: ActivityFieldProps) {
  const name = useId();
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Activity level</legend>
      <p className={styles.hint}>Your daily life, not your workouts.</p>
      <div className={styles.cards}>
        {ACTIVITY_LEVELS.map((level) => (
          <label key={level.id} className={styles.card}>
            <input
              type="radio"
              className={styles.radio}
              name={name}
              value={level.id}
              checked={value === level.id}
              onChange={() => {
                onChange(level.id);
              }}
            />
            <span className={styles.cardText}>
              <b>{level.label}</b>
              <span>{level.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
