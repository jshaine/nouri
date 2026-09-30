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
      onApply={() => {
        void s.onApply();
      }}
    />
  );
}
