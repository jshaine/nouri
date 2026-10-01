import { useState } from 'react';
import type { ProfileRepository } from '@/data';
import type { ActivityLevel, Profile } from '@/domain';
import { ActivityField } from '@/features/profile';
import { OnboardingStep, type StepPosition } from '../components/OnboardingStep';

interface ActivityStepProps extends StepPosition {
  profile: Profile;
  repo: Pick<ProfileRepository, 'update'>;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

/** How active your days are, which scales your calorie needs. */
export function ActivityStep({ profile, repo, ...nav }: ActivityStepProps) {
  const [activity, setActivity] = useState<ActivityLevel | undefined>(profile.activity);
  const [error, setError] = useState<string>();
  return (
    <OnboardingStep
      {...nav}
      title="How active are you?"
      intro="Pick the one closest to a usual day. Workouts you log later can add to your goal."
      nextLabel="Next"
      onNext={() => {
        if (!activity) {
          setError('Choose the one closest to your usual day.');
          return;
        }
        void repo.update({ activity }).then(nav.onNext);
      }}
    >
      <ActivityField
        value={activity}
        error={error}
        onChange={(level) => {
          setActivity(level);
          setError(undefined);
        }}
      />
    </OnboardingStep>
  );
}
