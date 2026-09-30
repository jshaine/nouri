import type { GoalFormErrors, GoalFormInput } from '@/domain';
import { NumberField } from '@/ui';
import styles from './GoalEditor.module.css';

interface GramFieldsProps {
  value: Pick<GoalFormInput, 'p' | 'c' | 'f'>;
  errors: GoalFormErrors;
  onChange: (field: 'p' | 'c' | 'f', value: string) => void;
  /** 4P + 4C + 9F, when all three are numbers. */
  kcal: number | undefined;
}

/** Direct gram targets; calories follow from them. */
export function GramFields({ value, errors, onChange, kcal }: GramFieldsProps) {
  const field = (key: 'p' | 'c' | 'f', label: string) => (
    <NumberField
      label={label}
      unit="g"
      inputMode="numeric"
      value={value[key]}
      error={errors[key]}
      onChange={(v) => {
        onChange(key, v);
      }}
    />
  );
  return (
    <div className={styles.group}>
      <div className={styles.macros}>
        {field('p', 'Protein')}
        {field('c', 'Carbs')}
        {field('f', 'Fat')}
      </div>
      <p className={styles.total} aria-live="polite">
        {kcal === undefined
          ? 'Calories: enter all three targets'
          : `= ${kcal.toLocaleString('en-US')} kcal a day`}
      </p>
    </div>
  );
}
