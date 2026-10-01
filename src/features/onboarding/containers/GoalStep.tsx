import { useState } from 'react';
import type { ProfileRepository } from '@/data';
import {
  formatWeight,
  kgToLb,
  MIN_BMI,
  minimumGoalWeightKg,
  parseBodyWeight,
  type Profile,
  type WeeklyGoal,
} from '@/domain';
import { ChoiceCards, NumberField } from '@/ui';
import { OnboardingStep, type StepPosition } from '../components/OnboardingStep';
import {
  DEFAULT_PACE,
  DIRECTION_OPTIONS,
  directionOf,
  paceOptions,
  type Direction,
} from './goalChoices';

interface GoalStepProps extends StepPosition {
  profile: Profile;
  currentKg: number;
  repo: Pick<ProfileRepository, 'update'>;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

const oneDecimal = (n: number) => String(Math.round(n * 10) / 10);

/** Lose, maintain or gain; for a change, the goal weight and how fast. */
export function GoalStep({ profile, currentKg, repo, ...nav }: GoalStepProps) {
  const { units } = profile;
  const [direction, setDirection] = useState(directionOf(profile.weeklyGoalKg));
  const [pace, setPace] = useState<WeeklyGoal | undefined>(profile.weeklyGoalKg);
  const [goalWeight, setGoalWeight] = useState(() =>
    profile.goalWeightKg === undefined || profile.weeklyGoalKg === 0
      ? ''
      : oneDecimal(units === 'metric' ? profile.goalWeightKg : kgToLb(profile.goalWeightKg)),
  );
  const [errors, setErrors] = useState<{ direction?: string; goalWeight?: string }>({});
  const now = formatWeight(currentKg, units);

  /** The goal weight for this direction, or why it doesn't fit. */
  const checkGoal = (dir: Exclude<Direction, 'maintain'>) => {
    const r = parseBodyWeight(units, goalWeight);
    if (!r.ok) return r;
    if (dir === 'lose' && r.value >= currentKg)
      return { ok: false as const, error: `To lose weight, enter less than ${now}.` };
    if (dir === 'gain' && r.value <= currentKg)
      return { ok: false as const, error: `To gain weight, enter more than ${now}.` };
    const min = profile.heightCm === undefined ? undefined : minimumGoalWeightKg(profile.heightCm);
    if (min !== undefined && r.value < min)
      return {
        ok: false as const,
        error: `The lowest goal weight for your height is ${formatWeight(min, units)} (a BMI of ${MIN_BMI}).`,
      };
    return r;
  };

  const next = () => {
    if (!direction) {
      setErrors({ direction: 'Choose what you’d like to do.' });
      return;
    }
    if (direction === 'maintain') {
      void repo.update({ goalWeightKg: currentKg, weeklyGoalKg: 0 }).then(nav.onNext);
      return;
    }
    const r = checkGoal(direction);
    if (!r.ok) {
      setErrors({ goalWeight: r.error });
      return;
    }
    const weeklyGoalKg = pace ?? DEFAULT_PACE[direction];
    void repo.update({ goalWeightKg: r.value, weeklyGoalKg }).then(nav.onNext);
  };

  return (
    <OnboardingStep
      {...nav}
      title="Your goal"
      intro={`You weigh ${now} now.`}
      nextLabel="See my plan"
      onNext={next}
    >
      <ChoiceCards
        label="What would you like to do?"
        options={DIRECTION_OPTIONS}
        value={direction}
        error={errors.direction}
        onChange={(d) => {
          setDirection(d);
          setPace(DEFAULT_PACE[d]);
          setErrors({});
        }}
      />
      {direction && direction !== 'maintain' && (
        <>
          <NumberField
            label="Goal weight"
            unit={units === 'metric' ? 'kg' : 'lb'}
            value={goalWeight}
            error={errors.goalWeight}
            onChange={(v) => {
              setGoalWeight(v);
              setErrors({});
            }}
          />
          <ChoiceCards
            label="How fast?"
            options={paceOptions(direction, units)}
            value={pace === undefined ? undefined : String(pace)}
            onChange={(v) => {
              setPace(Number(v) as WeeklyGoal);
            }}
          />
        </>
      )}
    </OnboardingStep>
  );
}
