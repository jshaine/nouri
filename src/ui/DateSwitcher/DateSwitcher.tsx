import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';
import type { LocalDate } from '@/domain';
import { IconButton } from '../IconButton/IconButton';
import styles from './DateSwitcher.module.css';

export interface DateSwitcherProps {
  date: LocalDate;
  /** "Today", "Yesterday" or a short date. */
  label: string;
  today: LocalDate;
  onPrevious: () => void;
  onNext: () => void;
  onPick: (date: LocalDate) => void;
  previousLabel?: string;
  nextLabel?: string;
}

/** Previous / next day, and a native date picker on the label. No future days. */
export function DateSwitcher({
  date,
  label,
  today,
  onPrevious,
  onNext,
  onPick,
  previousLabel = 'Previous day',
  nextLabel = 'Next day',
}: DateSwitcherProps) {
  const pickerId = useId();
  const isToday = date === today;
  return (
    <div className={styles.switcher}>
      <IconButton icon={ChevronLeft} label={previousLabel} onClick={onPrevious} />
      <label className={styles.picker} htmlFor={pickerId}>
        <span className={styles.label}>{label}</span>
        <span className="visually-hidden">, choose a date</span>
        <input
          id={pickerId}
          className={styles.input}
          type="date"
          value={date}
          max={today}
          onChange={(event) => {
            if (event.target.value) onPick(event.target.value as LocalDate);
          }}
        />
      </label>
      <IconButton
        icon={ChevronRight}
        label={nextLabel}
        onClick={onNext}
        disabled={isToday}
        className={isToday ? styles.hidden : undefined}
      />
    </div>
  );
}
