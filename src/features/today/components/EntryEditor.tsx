import { Trash2 } from 'lucide-react';
import { formatNumber, MEAL_NAME, MEALS, type MacroTotals, type Meal } from '@/domain';
import { Button, SegmentedControl, Stepper } from '@/ui';
import styles from './EntryEditor.module.css';

const MEAL_OPTIONS = MEALS.map((m) => ({ value: m, label: MEAL_NAME[m] }));

export interface EntryEditorProps {
  unitText: string;
  amount: number;
  step: number;
  onAmountChange: (amount: number) => void;
  meal: Meal;
  onMealChange: (meal: Meal) => void;
  totals: MacroTotals;
  onSave: () => void;
  onDelete: () => void;
  saving?: boolean;
  error?: string | undefined;
}

/** Change a logged amount or meal, or delete it. */
export function EntryEditor(props: EntryEditorProps) {
  const { amount, totals, saving = false, error } = props;
  return (
    <div className={styles.editor}>
      <div className={styles.amount}>
        <Stepper
          label="Amount"
          value={amount}
          step={props.step}
          min={0}
          onChange={props.onAmountChange}
        />
        <span className={styles.unit}>{props.unitText}</span>
      </div>
      <SegmentedControl
        label="Meal"
        options={MEAL_OPTIONS}
        value={props.meal}
        onChange={props.onMealChange}
      />
      <p className={styles.preview} aria-live="polite">
        <b>{formatNumber(totals.kcal)} kcal</b> · P {formatNumber(totals.p)} C{' '}
        {formatNumber(totals.c)} F {formatNumber(totals.f)}
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="ghost" icon={Trash2} onClick={props.onDelete}>
          Delete
        </Button>
        <Button variant="primary" disabled={saving || amount <= 0} onClick={props.onSave}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
