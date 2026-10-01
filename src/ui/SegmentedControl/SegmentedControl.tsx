import { useId } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  /** Visible group label (the fieldset legend). */
  label: string;
  options: readonly SegmentOption<T>[];
  /** undefined means nothing is chosen yet. */
  value: T | undefined;
  onChange: (value: T) => void;
  /** Hide the legend visually (it stays for screen readers). */
  hideLabel?: boolean;
  error?: string | undefined;
}

/** One-of-many choice built on native radios: arrow keys and forms work for free. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  hideLabel = false,
  error,
}: SegmentedControlProps<T>) {
  const name = useId();
  const errorId = `${name}-error`;
  return (
    <fieldset className={styles.group} aria-describedby={error ? errorId : undefined}>
      <legend className={hideLabel ? 'visually-hidden' : styles.legend}>{label}</legend>
      <div className={styles.track}>
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input
              type="radio"
              className={styles.radio}
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => {
                onChange(option.value);
              }}
            />
            <span className={styles.text}>{option.label}</span>
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
