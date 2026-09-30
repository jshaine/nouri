import type { CustomFoodErrors, CustomFoodInput } from '@/domain';
import { NumberField } from '@/ui';
import styles from './CustomFoodForm.module.css';

interface NutrientFieldsProps {
  value: CustomFoodInput;
  errors: CustomFoodErrors;
  onChange: (field: 'kcal' | 'p' | 'c' | 'f' | 'fiber', value: string) => void;
  idFor: (field: string) => string;
}

/** Calories and macros for one basis amount (per 100 g or per serving). */
export function NutrientFields({ value, errors, onChange, idFor }: NutrientFieldsProps) {
  const per = value.basis === '100g' ? 'per 100 g' : 'per serving';
  const field = (key: 'p' | 'c' | 'f', label: string) => (
    <NumberField
      id={idFor(key)}
      label={label}
      unit="g"
      value={value[key]}
      error={errors[key]}
      onChange={(v) => {
        onChange(key, v);
      }}
    />
  );

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Nutrition {per}</legend>
      <NumberField
        id={idFor('kcal')}
        label="Calories (optional)"
        unit="kcal"
        value={value.kcal}
        error={errors.kcal}
        hint="Leave empty to use 4 × protein + 4 × carbs + 9 × fat."
        onChange={(v) => {
          onChange('kcal', v);
        }}
      />
      <div className={styles.macros}>
        {field('p', 'Protein')}
        {field('c', 'Carbs')}
        {field('f', 'Fat')}
      </div>
      <NumberField
        id={idFor('fiber')}
        label="Fiber (optional)"
        unit="g"
        value={value.fiber}
        error={errors.fiber}
        onChange={(v) => {
          onChange('fiber', v);
        }}
      />
    </fieldset>
  );
}
