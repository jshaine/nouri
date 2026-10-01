import type { GoalRepository } from '@/data';
import type { LocalDate, Profile } from '@/domain';
import { useLive } from '@/ui';
import { SuggestionCard } from '../components/SuggestionCard';
import { useSuggestion } from '../hooks/useSuggestion';

export interface SuggestionContainerProps {
  profile: Profile;
  currentKg: number | undefined;
  repo: Pick<GoalRepository, 'live' | 'setFrom'>;
  today: LocalDate;
  applyLabel?: string;
  alwaysApply?: boolean;
  /** Called after the suggestion is saved as the goal. */
  onApplied?: () => void;
}

export function SuggestionContainer({ repo, ...rest }: SuggestionContainerProps) {
  const goals = useLive(() => repo.live(), [repo]);
  if (!goals.value) return null;
  return <Suggestion {...rest} goals={goals.value} repo={repo} />;
}

function Suggestion({
  profile,
  currentKg,
  goals,
  repo,
  today,
  applyLabel,
  alwaysApply = false,
  onApplied,
}: Omit<SuggestionContainerProps, 'repo'> & {
  goals: Parameters<typeof useSuggestion>[2];
  repo: Pick<GoalRepository, 'setFrom'>;
}) {
  const s = useSuggestion(profile, currentKg, goals, repo, today);
  return (
    <SuggestionCard
      state={s.state}
      preset={s.preset}
      onPreset={s.onPreset}
      applying={s.applying}
      message={s.message}
      {...(applyLabel ? { applyLabel } : {})}
      alwaysApply={alwaysApply}
      onApply={() => {
        void s.onApply().then((saved) => {
          if (saved) onApplied?.();
        });
      }}
    />
  );
}
