import type { SyntheticEvent } from 'react';
import { Button, NumberField, TextField } from '@/ui';
import styles from './Weight.module.css';

export interface WeightFormProps {
  unit: string;
  weight: string;
  date: string;
  today: string;
  error?: string | undefined;
  submitLabel: string;
  onWeight: (v: string) => void;
  onDate: (v: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}

/** Log (or edit) one weigh-in. */
export function WeightForm(props: WeightFormProps) {
  const submit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    props.onSubmit();
  };
  return (
    <form className={styles.form} noValidate onSubmit={submit}>
      <div className={styles.row}>
        <NumberField
          label="Weight"
          unit={props.unit}
          value={props.weight}
          error={props.error}
          onChange={props.onWeight}
        />
        <TextField
          label="Date"
          type="date"
          max={props.today}
          value={props.date}
          onChange={props.onDate}
        />
      </div>
      <div className={styles.actions}>
        {props.onCancel && (
          <Button variant="ghost" onClick={props.onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary">
          {props.submitLabel}
        </Button>
      </div>
    </form>
  );
}
