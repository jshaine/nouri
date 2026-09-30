import { useState } from 'react';
import type { ExerciseRepository } from '@/data';
import { parseDecimal, type LocalDate } from '@/domain';
import { ExerciseField } from '../components/ExerciseField';

const MAX_EXERCISE_KCAL = 5000;

interface ExerciseContainerProps {
  date: LocalDate;
  saved: number;
  repo: Pick<ExerciseRepository, 'set'>;
}

/** Edits the day's exercise kcal; saves when you leave the field. Remount per day. */
export function ExerciseContainer({ date, saved, repo }: ExerciseContainerProps) {
  const [text, setText] = useState(saved > 0 ? String(saved) : '');
  const [error, setError] = useState<string>();
  return (
    <ExerciseField
      value={text}
      error={error}
      onChange={(v) => {
        setText(v);
        setError(undefined);
      }}
      onCommit={() => {
        const kcal = text.trim() === '' ? 0 : parseDecimal(text);
        if (kcal === null || kcal > MAX_EXERCISE_KCAL) {
          setError(`Enter calories burned, from 0 to ${MAX_EXERCISE_KCAL}.`);
          return;
        }
        void repo.set(date, kcal);
      }}
    />
  );
}
