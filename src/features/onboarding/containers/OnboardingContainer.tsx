import { useState } from 'react';
import { useNavigate } from 'react-router';
import type {
  GoalRepository,
  ProfileRepository,
  SettingsRepository,
  WeightRepository,
} from '@/data';
import { goalForDate, latestWeight, toLocalDate } from '@/domain';
import { SuggestionContainer } from '@/features/goals';
import { SegmentedControl, useDocumentTitle, useLive } from '@/ui';
import { OnboardingStep } from '../components/OnboardingStep';
import { AboutYouStep } from './AboutYouStep';

const UNIT_OPTIONS = [
  { value: 'metric', label: 'kg, cm' },
  { value: 'imperial', label: 'lb, ft/in' },
] as const;
const TOTAL = 4;

export interface OnboardingContainerProps {
  repos: {
    profile: Pick<ProfileRepository, 'live' | 'update'>;
    weights: Pick<WeightRepository, 'live' | 'set'>;
    goals: Pick<GoalRepository, 'live' | 'setFrom'>;
    settings: Pick<SettingsRepository, 'set'>;
  };
  now?: () => Date;
}

/** First launch: units → about you → suggested goals → done (skippable). */
export function OnboardingContainer({ repos, now = () => new Date() }: OnboardingContainerProps) {
  useDocumentTitle('Welcome');
  const navigate = useNavigate();
  const today = toLocalDate(now());
  const [step, setStep] = useState(1);
  const profile = useLive(() => repos.profile.live(), [repos.profile]);
  const weights = useLive(() => repos.weights.live(), [repos.weights]);
  const goals = useLive(() => repos.goals.live(), [repos.goals]);
  const p = profile.value;
  if (!p || !weights.value) return null;
  const currentKg = latestWeight(weights.value)?.kg;

  const finish = async (to: string) => {
    await repos.settings.set('onboardingDone', true);
    void navigate(to, { replace: true });
  };
  const skip = () => {
    void finish('/settings');
  };

  if (step === 1) {
    return (
      <OnboardingStep
        step={1}
        total={TOTAL}
        title="Welcome to Nouri"
        nextLabel="Next"
        onNext={() => {
          setStep(2);
        }}
        onSkip={skip}
        intro="A food log that stays on this phone: no account, no ads, works offline. A few details give you suggested goals."
      >
        <SegmentedControl
          label="Units"
          options={UNIT_OPTIONS}
          value={p.units}
          onChange={(units) => {
            void repos.profile.update({ units });
          }}
        />
      </OnboardingStep>
    );
  }
  if (step === 2) {
    return (
      <AboutYouStep
        profile={p}
        currentKg={currentKg}
        today={today}
        repos={repos}
        onBack={() => {
          setStep(1);
        }}
        onNext={() => {
          setStep(3);
        }}
        onSkip={skip}
      />
    );
  }
  if (step === 3) {
    return (
      <OnboardingStep
        step={3}
        total={TOTAL}
        title="Suggested goals"
        nextLabel="Next"
        onNext={() => {
          setStep(4);
        }}
        onBack={() => {
          setStep(2);
        }}
        onSkip={skip}
      >
        <SuggestionContainer profile={p} currentKg={currentKg} repo={repos.goals} today={today} />
      </OnboardingStep>
    );
  }
  const hasGoal = goals.value ? goalForDate(goals.value, today) !== undefined : false;
  return (
    <OnboardingStep
      step={4}
      total={TOTAL}
      title="You’re set"
      nextLabel="Start logging"
      onBack={() => {
        setStep(3);
      }}
      onNext={() => {
        void finish('/');
      }}
      intro={
        hasGoal
          ? 'Your goals are ready. Tap Add food on Today to log your first meal.'
          : 'You can set goals anytime in Settings. Tap Add food on Today to log your first meal.'
      }
    />
  );
}
