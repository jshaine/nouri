import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '../IconButton/IconButton';
import styles from './Stepper.module.css';

export interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Quantity control: − / + buttons around an editable decimal input. */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
}: StepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => round(Math.min(max, Math.max(min, n)));

  const commit = (text: string) => {
    const parsed = Number.parseFloat(text.replace(',', '.'));
    if (Number.isFinite(parsed)) onChange(clamp(parsed));
    setDraft(null);
  };

  return (
    <div className={styles.stepper}>
      <IconButton
        icon={Minus}
        label={`Decrease ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => {
          onChange(clamp(value - step));
        }}
      />
      <input
        className={styles.input}
        aria-label={label}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={draft ?? String(value)}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onBlur={(event) => {
          commit(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget.value);
        }}
      />
      <IconButton
        icon={Plus}
        label={`Increase ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => {
          onChange(clamp(value + step));
        }}
      />
    </div>
  );
}
