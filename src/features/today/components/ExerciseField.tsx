import { NumberField } from '@/ui';

interface ExerciseFieldProps {
  value: string;
  error?: string | undefined;
  onChange: (value: string) => void;
  onCommit: () => void;
}

/** Calories burned exercising today; added to the day's goal. */
export function ExerciseField({ value, error, onChange, onCommit }: ExerciseFieldProps) {
  return (
    <NumberField
      label="Exercise"
      unit="kcal"
      inputMode="numeric"
      value={value}
      error={error}
      hint="Calories burned exercising. They’re added to today’s goal."
      onChange={onChange}
      onBlur={onCommit}
    />
  );
}
