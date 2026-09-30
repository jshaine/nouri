import { useSearchParams } from 'react-router';
import type {
  EntryRepository,
  ExerciseRepository,
  GoalRepository,
  ProfileRepository,
} from '@/data';
import {
  addDays,
  clampToToday,
  formatNumber,
  goalForDate,
  goalWithExercise,
  isAfter,
  startOfLocalDate,
  summarizeWeek,
  toLocalDate,
  weekOf,
  type LocalDate,
} from '@/domain';
import { DateSwitcher, useDocumentTitle, useLive } from '@/ui';
import { WeekChart } from '../components/WeekChart';
import { WeekList } from '../components/WeekList';
import { WeekSummaryCard } from '../components/WeekSummaryCard';
import styles from '../components/History.module.css';

export interface HistoryContainerProps {
  repos: {
    entries: Pick<EntryRepository, 'liveForRange'>;
    goals: Pick<GoalRepository, 'live'>;
    profile: Pick<ProfileRepository, 'live'>;
    exercise: Pick<ExerciseRepository, 'liveForRange'>;
  };
  now?: () => Date;
}

const fmt = (d: LocalDate, o: Intl.DateTimeFormatOptions) =>
  startOfLocalDate(d).toLocaleDateString('en-US', o);

/** A week of daily calories against goal; tap a day to open it. */
export function HistoryContainer({ repos, now = () => new Date() }: HistoryContainerProps) {
  useDocumentTitle('History');
  const today = toLocalDate(now());
  const [params, setParams] = useSearchParams();
  const days = weekOf(clampToToday(params.get('week'), today));
  const [monday, sunday] = [days[0] ?? today, days[6] ?? today];
  const entries = useLive(
    () => repos.entries.liveForRange(monday, sunday),
    [repos.entries, monday, sunday],
  );
  const goals = useLive(() => repos.goals.live(), [repos.goals]);
  const profile = useLive(() => repos.profile.live(), [repos.profile]);
  const exercise = useLive(
    () => repos.exercise.liveForRange(monday, sunday),
    [repos.exercise, monday, sunday],
  );

  const withExercise = profile.value?.exerciseCaloriesEnabled === true;
  const week = summarizeWeek(days, entries.value ?? [], (d) => {
    const g = goals.value ? goalForDate(goals.value, d) : undefined;
    return g && goalWithExercise(g, withExercise ? (exercise.value?.[d] ?? 0) : 0);
  });
  const go = (d: LocalDate) => {
    setParams(weekOf(d)[0] === weekOf(today)[0] ? {} : { week: weekOf(d)[0] ?? d }, {
      replace: true,
    });
  };
  const rangeLabel = `${fmt(monday, { month: 'short', day: 'numeric' })} – ${fmt(sunday, { month: 'short', day: 'numeric' })}`;
  const thisWeek = weekOf(today)[0] === monday;

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>History</h1>
      <DateSwitcher
        date={monday}
        label={thisWeek ? 'This week' : rangeLabel}
        today={thisWeek ? monday : today}
        onPrevious={() => {
          go(addDays(monday, -7));
        }}
        onNext={() => {
          go(addDays(monday, 7));
        }}
        onPick={go}
        previousLabel="Previous week"
        nextLabel="Next week"
      />
      <WeekChart
        days={week.days.map((d) => ({
          key: d.date,
          weekday: fmt(d.date, { weekday: 'short' }),
          dayOfMonth: fmt(d.date, { day: 'numeric' }),
          kcal: d.totals.kcal,
          goal: d.goal?.kcal,
          href: d.date === today ? '/' : `/?date=${d.date}`,
          future: isAfter(d.date, today),
          label: `${fmt(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}: ${
            d.logged ? `${formatNumber(d.totals.kcal)} kcal` : 'nothing logged'
          }${d.goal ? ` of ${formatNumber(d.goal.kcal)} goal` : ''}`,
        }))}
      />
      <p className={styles.legend}>
        <span>Goal</span>
      </p>
      <WeekSummaryCard loggedDays={week.loggedDays} average={week.average} />
      <WeekList
        days={week.days.map((d) => ({
          key: d.date,
          name: fmt(d.date, { weekday: 'long', month: 'short', day: 'numeric' }),
          kcal: d.logged ? `${formatNumber(d.totals.kcal)} kcal` : undefined,
          goal: d.goal ? `${formatNumber(d.goal.kcal)} goal` : undefined,
          href: d.date === today ? '/' : `/?date=${d.date}`,
          future: isAfter(d.date, today),
        }))}
      />
    </div>
  );
}
