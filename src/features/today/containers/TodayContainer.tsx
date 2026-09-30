import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router';
import type { EntryRepository, GoalRepository } from '@/data';
import { MEALS, relativeDayLabel, toLocalDate } from '@/domain';
import { EmptyState, useDocumentTitle } from '@/ui';
import { DateSwitcher } from '../components/DateSwitcher';
import { MealSection } from '../components/MealSection';
import { NutritionLabel } from '../components/NutritionLabel';
import { useDayLog } from '../hooks/useDayLog';
import { useSelectedDate } from '../hooks/useSelectedDate';
import styles from './TodayContainer.module.css';

export interface TodayContainerProps {
  repos: {
    entries: Pick<EntryRepository, 'liveForDate'>;
    goals: Pick<GoalRepository, 'live'>;
  };
  now?: () => Date;
}

export function TodayContainer({ repos, now = () => new Date() }: TodayContainerProps) {
  const today = toLocalDate(now());
  const { date, go, previous, next } = useSelectedDate(today);
  const day = useDayLog(repos, date);
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
        MEALS.map((meal) => <MealSection key={meal} meal={meal} entries={day.groups[meal]} />)
      )}
    </div>
  );
}
