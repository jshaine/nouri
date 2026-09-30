import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import fieldStyles from '../Field/Field.module.css';
import styles from './SelectField.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

/** Native select, so phones show their own thumb-friendly picker. */
export function SelectField({ label, options, value, onChange, hint }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={fieldStyles.field}>
      <label className={fieldStyles.label} htmlFor={id}>
        {label}
      </label>
      <div className={`${fieldStyles.control} ${styles.control}`}>
        <select
          id={id}
          className={styles.select}
          value={value}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </div>
      {hint && (
        <p id={`${id}-hint`} className={fieldStyles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
