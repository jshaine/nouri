import { useId, type InputHTMLAttributes } from 'react';
import styles from './NumberField.module.css';

export interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode'
> {
  label: string;
  /** Raw text, so partial input like "1." survives while typing. */
  value: string;
  onChange: (value: string) => void;
  /** Unit shown after the input, e.g. "g" or "kcal". */
  unit?: string;
  /** "decimal" for amounts, "numeric" for whole numbers. */
  inputMode?: 'decimal' | 'numeric';
  hint?: string;
  error?: string;
}

/** Labeled number input that opens the numeric keypad on phones. */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  inputMode = 'decimal',
  hint,
  error,
  id,
  className,
  ...rest
}: NumberFieldProps) {
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
          inputMode={inputMode}
          autoComplete="off"
          enterKeyHint="done"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          {...rest}
        />
        {unit && (
          <span className={styles.unit} aria-hidden="true">
            {unit}
          </span>
        )}
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
