import { useId } from 'react';
import styles from './ChoiceCards.module.css';

export interface ChoiceCardOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export interface ChoiceCardsProps<T extends string> {
  /** Visible group label (the fieldset legend). */
  label: string;
  hint?: string;
  options: readonly ChoiceCardOption<T>[];
  /** undefined means nothing is chosen yet. */
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string | undefined;
}

/** One-of-many choice as stacked cards with an optional description, on native radios. */
export function ChoiceCards<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  error,
}: ChoiceCardsProps<T>) {
  const name = useId();
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset className={styles.group} aria-describedby={describedBy}>
      <legend className={styles.legend}>{label}</legend>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      <div className={styles.cards}>
        {options.map((option) => (
          <label key={option.value} className={styles.card}>
            <input
              type="radio"
              className={styles.radio}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
            />
            <span className={styles.text}>
              <b>{option.label}</b>
              {option.description && (
                <>
                  {' '}
                  <span>{option.description}</span>
                </>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
