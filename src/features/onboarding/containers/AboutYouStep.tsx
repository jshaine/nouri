import { useState } from 'react';
import type { ProfileRepository, WeightRepository } from '@/data';
import { parseBodyWeight, type LocalDate, type Profile } from '@/domain';
import { ProfileDetailsContainer } from '@/features/profile';
import { NumberField } from '@/ui';
import { OnboardingStep } from '../components/OnboardingStep';

interface AboutYouStepProps {
  profile: Profile;
  currentKg: number | undefined;
  today: LocalDate;
  repos: { profile: Pick<ProfileRepository, 'update'>; weights: Pick<WeightRepository, 'set'> };
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

/** Step 2: the calculator's details, plus a current weight that becomes the first weigh-in. */
export function AboutYouStep({
  profile,
  currentKg,
  today,
  repos,
  onBack,
  onNext,
  onSkip,
}: AboutYouStepProps) {
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string>();

  const next = async () => {
    if (weight.trim()) {
      const r = parseBodyWeight(profile.units, weight);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      await repos.weights.set(today, r.value);
    }
    onNext();
  };

  return (
    <OnboardingStep
      step={2}
      total={4}
      title="About you"
      intro="Used only to estimate your needs. You can change these anytime in Profile."
      nextLabel="Next"
      onBack={onBack}
      onNext={() => {
        void next();
      }}
      onSkip={onSkip}
    >
      <NumberField
        label="Current weight"
        unit={profile.units === 'metric' ? 'kg' : 'lb'}
        value={weight}
        error={error}
        hint={
          currentKg === undefined
            ? 'This becomes your first weigh-in.'
            : 'Leave empty to keep your last weigh-in.'
        }
        onChange={(v) => {
          setWeight(v);
          setError(undefined);
        }}
      />
      <ProfileDetailsContainer
        key={profile.units}
        profile={profile}
        repo={repos.profile}
        currentKg={currentKg}
        today={today}
      />
    </OnboardingStep>
  );
}
