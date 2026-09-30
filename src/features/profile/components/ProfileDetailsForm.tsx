import { kgToLb, type Profile, type UnitSystem, type WeeklyGoal } from '@/domain';
import { NumberField, SegmentedControl, SelectField, TextField } from '@/ui';
import { ActivityField } from './ActivityField';
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
  drafts: { birthDate: string; cm: string; ft: string; in: string; goalWeight: string };
  errors: Partial<Record<'birthDate' | 'height' | 'goalWeight', string>>;
  paces: readonly WeeklyGoal[];
  today: string;
  hasWeight: boolean;
  onEdit: (field: 'birthDate' | 'cm' | 'ft' | 'in' | 'goalWeight', value: string) => void;
  onCommit: (field: 'birthDate' | 'height' | 'goalWeight') => void;
  onSex: (sex: 'female' | 'male') => void;
  onActivity: (level: NonNullable<Profile['activity']>) => void;
  onWeeklyGoal: (kg: WeeklyGoal) => void;
}

/** The details the goal calculator needs. */
export function ProfileDetailsForm(props: ProfileDetailsFormProps) {
  const { profile, drafts, errors, onEdit, onCommit } = props;
  const metric = profile.units === 'metric';
  const pace =
    profile.weeklyGoalKg !== undefined && props.paces.includes(profile.weeklyGoalKg)
      ? profile.weeklyGoalKg
      : 0;
  return (
    <div className={styles.form}>
      <SegmentedControl
        label="Sex (for the calorie formula)"
        options={SEX_OPTIONS}
        value={profile.sex}
        onChange={props.onSex}
      />
      <TextField
        label="Birth date"
        type="date"
        max={props.today}
        value={drafts.birthDate}
        error={errors.birthDate}
        onChange={(v) => {
          onEdit('birthDate', v);
        }}
        onBlur={() => {
          onCommit('birthDate');
        }}
      />
      {metric ? (
        <NumberField
          label="Height"
          unit="cm"
          value={drafts.cm}
          error={errors.height}
          onChange={(v) => {
            onEdit('cm', v);
          }}
          onBlur={() => {
            onCommit('height');
          }}
        />
      ) : (
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Height</legend>
          <div className={styles.pair}>
            <NumberField
              label="Feet"
              unit="ft"
              inputMode="numeric"
              value={drafts.ft}
              onChange={(v) => {
                onEdit('ft', v);
              }}
              onBlur={() => {
                onCommit('height');
              }}
            />
            <NumberField
              label="Inches"
              unit="in"
              value={drafts.in}
              error={errors.height}
              onChange={(v) => {
                onEdit('in', v);
              }}
              onBlur={() => {
                onCommit('height');
              }}
            />
          </div>
        </fieldset>
      )}
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
        options={props.paces.map((kg) => ({
          value: String(kg),
          label: paceLabel(kg, profile.units),
        }))}
        value={String(pace)}
        hint={props.hasWeight ? undefined : 'Log your current weight below to choose a pace.'}
        onChange={(v) => {
          props.onWeeklyGoal(Number(v) as WeeklyGoal);
        }}
      />
    </div>
  );
}
