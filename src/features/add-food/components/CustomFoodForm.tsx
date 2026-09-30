import { useEffect, useId, useRef, type SyntheticEvent } from 'react';
import type { CustomFoodErrors, CustomFoodField, CustomFoodInput } from '@/domain';
import { Button, NumberField, SegmentedControl, TextField } from '@/ui';
import { NutrientFields } from './NutrientFields';
import styles from './CustomFoodForm.module.css';

const WEIGHT_UNITS = [
  { value: 'g', label: 'g' },
  { value: 'oz', label: 'oz' },
] as const;

const BASIS_OPTIONS = [
  { value: '100g', label: 'Per 100 g' },
  { value: 'serving', label: 'Per serving' },
] as const;

/** Fields in visual order, for moving focus to the first error. */
const FIELD_ORDER: readonly CustomFoodField[] = [
  'name',
  'aliases',
  'servingGrams',
  'kcal',
  'p',
  'c',
  'f',
  'fiber',
];

export interface CustomFoodFormProps {
  value: CustomFoodInput;
  errors: CustomFoodErrors;
  onChange: <K extends keyof CustomFoodInput>(field: K, value: CustomFoodInput[K]) => void;
  onSubmit: () => void;
  submitLabel: string;
  saving?: boolean;
  /** A save failure (not a field problem), with what to do about it. */
  saveError?: string | undefined;
}

export function CustomFoodForm({
  value,
  errors,
  onChange,
  onSubmit,
  submitLabel,
  saving = false,
  saveError,
}: CustomFoodFormProps) {
  const prefix = useId();
  const idFor = (field: string) => `${prefix}-${field}`;
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed submit, take the user to the first problem.
  useEffect(() => {
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (first)
      formRef.current?.querySelector<HTMLInputElement>(`[id="${prefix}-${first}"]`)?.focus();
  }, [errors, prefix]);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form ref={formRef} className={styles.form} noValidate onSubmit={submit}>
      <TextField
        id={idFor('name')}
        label="Name"
        value={value.name}
        error={errors.name}
        autoComplete="off"
        placeholder="Chicken adobo"
        onChange={(v) => {
          onChange('name', v);
        }}
      />
      <TextField
        id={idFor('aliases')}
        label="Also called (optional)"
        value={value.aliases}
        hint="Other names to search by, separated by commas."
        autoComplete="off"
        placeholder="adobo, braised chicken"
        onChange={(v) => {
          onChange('aliases', v);
        }}
      />
      <SegmentedControl
        label="I have the numbers"
        options={BASIS_OPTIONS}
        value={value.basis}
        onChange={(v) => {
          onChange('basis', v);
        }}
      />
      {value.basis === 'serving' && (
        <div className={styles.servingRow}>
          <NumberField
            id={idFor('servingGrams')}
            label="Serving weight (optional)"
            unit={value.servingUnit}
            value={value.servingGrams}
            error={errors.servingGrams}
            hint="Leave empty if you don’t know it. You’ll log this food by serving."
            onChange={(v) => {
              onChange('servingGrams', v);
            }}
          />
          <SegmentedControl
            label="Weight unit"
            hideLabel
            options={WEIGHT_UNITS}
            value={value.servingUnit}
            onChange={(v) => {
              onChange('servingUnit', v);
            }}
          />
        </div>
      )}
      <NutrientFields value={value} errors={errors} onChange={onChange} idFor={idFor} />
      {saveError && (
        <p className={styles.saveError} role="alert">
          {saveError}
        </p>
      )}
      <Button type="submit" variant="primary" block disabled={saving}>
        {saving ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
