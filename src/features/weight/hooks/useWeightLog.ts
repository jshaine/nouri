import { useState } from 'react';
import type { WeightRepository } from '@/data';
import {
  kgToLb,
  parseBodyWeight,
  type LocalDate,
  type UnitSystem,
  type WeightEntry,
} from '@/domain';

export const WEIGHT_SAVE_FAILED =
  'Couldn’t save the weight. Check that your browser allows this site to store data, then try again.';

const inUnits = (kg: number, units: UnitSystem) =>
  Math.round((units === 'metric' ? kg : kgToLb(kg)) * 10) / 10;

/** Logging, editing and deleting (with undo) weigh-ins. */
export function useWeightLog(
  repo: Pick<WeightRepository, 'set' | 'update' | 'remove'>,
  units: UnitSystem,
  today: LocalDate,
  onLogged?: (entry: WeightEntry) => void,
) {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState<string>(today);
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState<{
    entry: WeightEntry;
    weight: string;
    date: string;
    error?: string;
  }>();
  const [removed, setRemoved] = useState<WeightEntry>();
  const [failed, setFailed] = useState<string>();

  const run = async (action: () => Promise<void>) => {
    setFailed(undefined);
    try {
      await action();
    } catch {
      setFailed(WEIGHT_SAVE_FAILED);
    }
  };
  const validDate = (d: string) => (d && d <= today ? (d as LocalDate) : today);

  return {
    weight,
    date,
    error,
    editing,
    removed,
    failed,
    setWeight: (v: string) => {
      setWeight(v);
      setError(undefined);
    },
    setDate,
    async log() {
      const r = parseBodyWeight(units, weight);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      await run(async () => {
        const entry = await repo.set(validDate(date), r.value);
        setWeight('');
        setDate(today);
        onLogged?.(entry);
      });
    },
    startEdit: (entry: WeightEntry) => {
      setEditing({ entry, weight: String(inUnits(entry.kg, units)), date: entry.date });
    },
    editField: (field: 'weight' | 'date', value: string) => {
      setEditing((e) => e && { ...e, [field]: value, error: undefined });
    },
    cancelEdit: () => {
      setEditing(undefined);
    },
    async saveEdit() {
      if (!editing) return;
      const r = parseBodyWeight(units, editing.weight);
      if (!r.ok) {
        setEditing({ ...editing, error: r.error });
        return;
      }
      await run(async () => {
        await repo.update({ ...editing.entry, date: validDate(editing.date), kg: r.value });
        setEditing(undefined);
      });
    },
    async remove(entry: WeightEntry) {
      await run(async () => {
        await repo.remove(entry.id);
        setRemoved(entry);
      });
    },
    async undo() {
      if (!removed) return;
      const entry = removed;
      await run(async () => {
        await repo.update(entry);
        setRemoved(undefined);
      });
    },
    dismissUndo: () => {
      setRemoved(undefined);
    },
  };
}
