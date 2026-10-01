import { useState } from 'react';
import { useNavigate } from 'react-router';
import type {
  GoalRepository,
  ProfileRepository,
  SettingsRepository,
  WeightRepository,
} from '@/data';
import { latestWeight, toLocalDate } from '@/domain';
import { SuggestionContainer } from '@/features/goals';
import { SegmentedControl, useDocumentTitle, useLive } from '@/ui';
import { OnboardingStep } from '../components/OnboardingStep';
import { AboutYouStep } from './AboutYouStep';
import { ActivityStep } from './ActivityStep';
import { GoalStep } from './GoalStep';

const UNIT_OPTIONS = [
  { value: 'metric', label: 'kg, cm' },
  { value: 'imperial', label: 'lb, ft/in' },
] as const;
const STEPS = ['welcome', 'about', 'activity', 'goal', 'plan'] as const;

export interface OnboardingContainerProps {
  repos: {
    profile: Pick<ProfileRepository, 'live' | 'update'>;
    weights: Pick<WeightRepository, 'live' | 'set'>;
    goals: Pick<GoalRepository, 'live' | 'setFrom'>;
    settings: Pick<SettingsRepository, 'set'>;
  };
  now?: () => Date;
}

/** First launch: units → about you → activity → goal → your plan (skippable). */
export function OnboardingContainer({ repos, now = () => new Date() }: OnboardingContainerProps) {
  useDocumentTitle('Welcome');
  const navigate = useNavigate();
  const today = toLocalDate(now());
  const [index, setIndex] = useState(0);
  const profile = useLive(() => repos.profile.live(), [repos.profile]);
  const weights = useLive(() => repos.weights.live(), [repos.weights]);
  const p = profile.value;
  if (!p || !weights.value) return null;
  const currentKg = latestWeight(weights.value)?.kg;

  const finish = async (to: string) => {
    await repos.settings.set('onboardingDone', true);
    void navigate(to, { replace: true });
  };
  const nav = {
    step: index + 1,
    total: STEPS.length,
    onBack: () => {
      setIndex(index - 1);
    },
    onNext: () => {
      setIndex(index + 1);
    },
    onSkip: () => {
      void finish('/settings');
    },
  };
  const step = STEPS[index];

  if (step === 'about') {
    return <AboutYouStep {...nav} profile={p} currentKg={currentKg} today={today} repos={repos} />;
  }
  if (step === 'activity') return <ActivityStep {...nav} profile={p} repo={repos.profile} />;
  if (step === 'goal') {
    // About you saves a weight before moving on; wait for it to arrive.
    if (currentKg === undefined) return null;
    return <GoalStep {...nav} profile={p} currentKg={currentKg} repo={repos.profile} />;
  }
  if (step === 'plan') {
    return (
      <OnboardingStep
        {...nav}
        onNext={undefined}
        title="Your plan"
        intro="Suggested from your details. You can change it anytime in Settings."
      >
        <SuggestionContainer
          profile={p}
          currentKg={currentKg}
          repo={repos.goals}
          today={today}
          applyLabel="Use this plan and start"
          alwaysApply
          onApplied={() => {
            void finish('/');
          }}
        />
      </OnboardingStep>
    );
  }
  return (
    <OnboardingStep
      {...nav}
      onBack={undefined}
      title="Welcome to Nouri"
      intro="A food log that stays on this phone: no account, no ads, works offline. Answer a few questions and we’ll suggest your daily calories, protein, carbs and fat."
      nextLabel="Get started"
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
