import { useId, type InputHTMLAttributes } from 'react';
import styles from '../Field/Field.module.css';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}

/** Labeled text input with hint and error text linked for screen readers. */
export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.control} data-invalid={error ? 'true' : undefined}>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          {...rest}
        />
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
