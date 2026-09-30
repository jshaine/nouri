import { ClipboardList, Plus } from 'lucide-react';
import { Link } from 'react-router';
import type { Repositories } from '@/data';
import { mealForTime, MEALS, relativeDayLabel, toLocalDate } from '@/domain';
import { AddFoodSheet } from '@/features/add-food';
import { Button, EmptyState, Sheet, Toast, useDocumentTitle } from '@/ui';
import { DateSwitcher } from '../components/DateSwitcher';
import { MealSection } from '../components/MealSection';
import { NutritionLabel } from '../components/NutritionLabel';
import { useDayLog } from '../hooks/useDayLog';
import { useLogActions } from '../hooks/useLogActions';
import { useSelectedDate } from '../hooks/useSelectedDate';
import { EntryEditorContainer } from './EntryEditorContainer';
import { EntryRowContainer } from './EntryRowContainer';
import styles from './TodayContainer.module.css';

export interface TodayContainerProps {
  repos: Pick<Repositories, 'entries' | 'goals' | 'customFoods' | 'settings' | 'foods'>;
  now?: () => Date;
}

export function TodayContainer({ repos, now = () => new Date() }: TodayContainerProps) {
  const today = toLocalDate(now());
  const { date, go, previous, next } = useSelectedDate(today);
  const day = useDayLog(repos, date);
  const log = useLogActions(repos);
  const label = relativeDayLabel(date, today);
  useDocumentTitle(label);

  return (
    <div className={styles.screen}>
      <h1 className="visually-hidden">Food log for {label}</h1>
      <DateSwitcher
        date={date}
        label={label}
        today={today}
        onPrevious={previous}
        onNext={next}
        onPick={go}
      />
      {day.failed && (
        <p className={styles.error} role="alert">
          Couldn’t read your log. Close other Nouri tabs and reload; your data is still on this
          device.
        </p>
      )}
      <NutritionLabel
        totals={day.totals}
        goal={day.goal}
        noGoalAction={
          <Link to="/settings" className={styles.link}>
            Set goals
          </Link>
        }
      />
      {day.loaded && day.entries.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={`Nothing logged ${label === 'Today' ? 'today' : 'for this day'}`}
        >
          Tap Add food to log what you ate.
        </EmptyState>
      ) : (
        MEALS.map((meal) => (
          <MealSection
            key={meal}
            meal={meal}
            entries={day.groups[meal]}
            renderEntry={(e) => (
              <EntryRowContainer key={e.id} entry={e} onOpen={log.openEdit} onDelete={log.remove} />
            )}
          />
        ))
      )}

      <div className={styles.dock}>
        {log.toast && (
          <Toast
            key={log.toast.id}
            message={log.toast.message}
            {...(log.toast.undo ? { actionLabel: 'Undo', onAction: log.toast.undo } : {})}
            onDismiss={log.dismissToast}
          />
        )}
        <Button variant="primary" pill icon={Plus} onClick={log.openAdd}>
          Add food
        </Button>
      </div>

      <AddFoodSheet
        open={log.adding}
        onClose={log.closeAdd}
        date={date}
        defaultMeal={mealForTime(now())}
        repos={repos}
        onAdded={log.onAdded}
      />
      <Sheet
        open={log.editing !== undefined}
        onClose={log.closeEdit}
        title={log.editing?.name ?? 'Edit entry'}
      >
        {log.editing && (
          <EntryEditorContainer
            key={log.editing.id}
            entry={log.editing}
            repo={repos.entries}
            onDone={log.closeEdit}
            onDelete={log.remove}
          />
        )}
      </Sheet>
    </div>
  );
}
