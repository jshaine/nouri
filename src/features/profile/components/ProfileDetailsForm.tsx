import { kgToLb, type Profile, type UnitSystem, type WeeklyGoal } from '@/domain';
import { NumberField, SegmentedControl, SelectField } from '@/ui';
import { ActivityField } from './ActivityField';
import { HeightField } from './HeightField';
import styles from './Profile.module.css';

const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
] as const;

export function paceLabel(kg: WeeklyGoal, units: UnitSystem): string {
  if (kg === 0) return 'Maintain my weight';
  const amount = Math.abs(kg);
  const shown = units === 'metric' ? `${amount} kg` : `${Math.round(kgToLb(amount) * 10) / 10} lb`;
  return `${kg < 0 ? 'Lose' : 'Gain'} ${shown} per week`;
}

export interface ProfileDetailsFormProps {
  profile: Profile;
  drafts: { age: string; cm: string; ft: string; in: string; goalWeight: string };
  errors: Partial<Record<'age' | 'height' | 'goalWeight', string>>;
  paces: readonly WeeklyGoal[];
  hasWeight: boolean;
  onEdit: (field: 'age' | 'cm' | 'ft' | 'in' | 'goalWeight', value: string) => void;
  onCommit: (field: 'age' | 'height' | 'goalWeight') => void;
  onSex: (sex: 'female' | 'male') => void;
  onActivity: (level: NonNullable<Profile['activity']>) => void;
  onWeeklyGoal: (kg: WeeklyGoal) => void;
}

/** The details the goal calculator needs. */
export function ProfileDetailsForm(props: ProfileDetailsFormProps) {
  const { profile, drafts, errors, onEdit, onCommit } = props;
  const metric = profile.units === 'metric';
  // No pace is shown as chosen until one is saved (a default that isn't saved misleads).
  const chosen =
    profile.weeklyGoalKg !== undefined && props.paces.includes(profile.weeklyGoalKg)
      ? String(profile.weeklyGoalKg)
      : '';
  const paceOptions = props.paces.map((kg) => ({
    value: String(kg),
    label: paceLabel(kg, profile.units),
  }));
  return (
    <div className={styles.form}>
      <SegmentedControl
        label="Sex (for the calorie formula)"
        options={SEX_OPTIONS}
        value={profile.sex}
        onChange={props.onSex}
      />
      <NumberField
        label="Age"
        unit="years"
        inputMode="numeric"
        value={drafts.age}
        error={errors.age}
        onChange={(v) => {
          onEdit('age', v);
        }}
        onBlur={() => {
          onCommit('age');
        }}
      />
      <HeightField
        units={profile.units}
        drafts={drafts}
        error={errors.height}
        onEdit={onEdit}
        onBlur={() => {
          onCommit('height');
        }}
      />
      <NumberField
        label="Goal weight"
        unit={metric ? 'kg' : 'lb'}
        value={drafts.goalWeight}
        error={errors.goalWeight}
        onChange={(v) => {
          onEdit('goalWeight', v);
        }}
        onBlur={() => {
          onCommit('goalWeight');
        }}
      />
      <ActivityField value={profile.activity} onChange={props.onActivity} />
      <SelectField
        label="Weekly goal"
        options={
          chosen ? paceOptions : [{ value: '', label: 'Choose a weekly goal' }, ...paceOptions]
        }
        value={chosen}
        hint={props.hasWeight ? undefined : 'Log your current weight below to choose a pace.'}
        onChange={(v) => {
          if (v) props.onWeeklyGoal(Number(v) as WeeklyGoal);
        }}
      />
    </div>
  );
}
