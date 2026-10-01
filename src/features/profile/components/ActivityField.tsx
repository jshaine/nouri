import { ACTIVITY_LEVELS, type ActivityLevel } from '@/domain';
import { ChoiceCards } from '@/ui';

const OPTIONS = ACTIVITY_LEVELS.map((level) => ({
  value: level.id,
  label: level.label,
  description: level.description,
}));

interface ActivityFieldProps {
  value: ActivityLevel | undefined;
  onChange: (level: ActivityLevel) => void;
  error?: string | undefined;
}

/** Daily-life activity (not workouts), as radio cards with examples. */
export function ActivityField({ value, onChange, error }: ActivityFieldProps) {
  return (
    <ChoiceCards
      label="Activity level"
      hint="Your daily life, not your workouts."
      options={OPTIONS}
      value={value}
      onChange={onChange}
      error={error}
    />
  );
}
