import type { PortionErrors } from '@/domain';
import { Button, NumberField, TextField } from '@/ui';
import styles from './FoodDetail.module.css';

export interface SavePortionFormProps {
  kind: 'grams' | 'servings';
  label: string;
  amount: string;
  errors: PortionErrors;
  onLabel: (v: string) => void;
  onAmount: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  saveError?: string | undefined;
}

/** Name a portion (e.g. "1 cup kanin") and its weight, to reuse later. */
export function SavePortionForm(props: SavePortionFormProps) {
  const { kind, errors, saving = false } = props;
  return (
    <fieldset className={styles.portionForm}>
      <legend className={styles.portionLegend}>Save a portion</legend>
      <TextField
        label="Portion name"
        placeholder="1 cup kanin"
        autoComplete="off"
        value={props.label}
        error={errors.label}
        onChange={props.onLabel}
      />
      <NumberField
        label={kind === 'grams' ? 'Weight' : 'Servings'}
        unit={kind === 'grams' ? 'g' : '× serving'}
        value={props.amount}
        error={errors.amount}
        hint={
          kind === 'grams'
            ? 'Filled in from what you picked above.'
            : 'This food has no weight, so portions are in servings.'
        }
        onChange={props.onAmount}
      />
      {props.saveError && (
        <p className={styles.error} role="alert">
          {props.saveError}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="ghost" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button onClick={props.onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save portion'}
        </Button>
      </div>
    </fieldset>
  );
}
