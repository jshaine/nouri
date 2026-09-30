import type { GoalRepository } from '@/data';
import { goalForDate, goalToForm, toLocalDate, type LocalDate } from '@/domain';
import { useLive } from '@/ui';
import { GoalEditor } from '../components/GoalEditor';
import { useGoalForm } from '../hooks/useGoalForm';

export interface GoalsContainerProps {
  repo: Pick<GoalRepository, 'live' | 'setFrom'>;
  now?: () => Date;
}

/** Manual goal editing: loads today's goal, saves a new one effective today. */
export function GoalsContainer({ repo, now = () => new Date() }: GoalsContainerProps) {
  const today = toLocalDate(now());
  const goals = useLive(() => repo.live(), [repo]);
  if (goals.value === undefined) return null;
  // The form takes its starting values once; saving doesn't reset what's shown.
  return <GoalForm initial={goalForDate(goals.value, today)} repo={repo} today={today} />;
}

function GoalForm({
  initial,
  repo,
  today,
}: {
  initial: Parameters<typeof goalToForm>[0];
  repo: Pick<GoalRepository, 'setFrom'>;
  today: LocalDate;
}) {
  const form = useGoalForm(goalToForm(initial), repo, today);
  return (
    <GoalEditor
      {...form}
      onSubmit={() => {
        void form.onSubmit();
      }}
    />
  );
}
