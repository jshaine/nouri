import { useSearchParams } from 'react-router';
import { addDays, clampToToday, isAfter, type LocalDate } from '@/domain';

/**
 * The day being viewed, from `?date=` (so back/forward and links work).
 * Today has no parameter; future or invalid dates fall back to today.
 */
export function useSelectedDate(today: LocalDate) {
  const [params, setParams] = useSearchParams();
  const date = clampToToday(params.get('date'), today);

  const go = (next: LocalDate) => {
    const target = isAfter(next, today) ? today : next;
    setParams(target === today ? {} : { date: target }, { replace: true });
  };

  return {
    date,
    go,
    previous: () => {
      go(addDays(date, -1));
    },
    next: () => {
      go(addDays(date, 1));
    },
  };
}
