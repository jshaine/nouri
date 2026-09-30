import { useState } from 'react';
import type { EntryRepository } from '@/data';
import { stepFor, unitLabel, withAmount, type Entry, type Meal } from '@/domain';

export const SAVE_FAILED =
  'Couldn’t save the change. Check that your browser allows this site to store data, then try again.';

/** Editing one entry: amount (same unit, snapshot rescaled) and meal. */
export function useEntryEditor(
  entry: Entry,
  repo: Pick<EntryRepository, 'update'>,
  onDone: () => void,
) {
  const [amount, setAmount] = useState(entry.amount);
  const [meal, setMeal] = useState<Meal>(entry.meal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const preview = amount > 0 ? withAmount(entry, amount).totals : { kcal: 0, p: 0, c: 0, f: 0 };

  const onSave = async () => {
    if (!(amount > 0)) return;
    setSaving(true);
    setError(undefined);
    try {
      await repo.update({ ...withAmount(entry, amount), meal });
      onDone();
    } catch {
      setError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  return {
    unitText:
      entry.unit.kind === 'grams'
        ? 'grams'
        : entry.unit.kind === 'ounces'
          ? 'ounces'
          : `× ${unitLabel(entry.unit)}`,
    amount,
    step: stepFor(entry.unit),
    onAmountChange: setAmount,
    meal,
    onMealChange: setMeal,
    totals: preview,
    saving,
    error,
    onSave,
  };
}
