import { useState } from 'react';
import type { GoalRepository } from '@/data';
import {
  gramsFromPercents,
  goalFromGrams,
  isValidPercents,
  MACRO_PRESETS,
  parseDecimal,
  presetFor,
  validateGoalForm,
  type GoalFormErrors,
  type GoalFormInput,
  type LocalDate,
  type MacroPercents,
  type PresetId,
} from '@/domain';

export const GOAL_SAVE_FAILED =
  'Couldn’t save your goals. Check that your browser allows this site to store data, then try again.';

/** Goal editing state; saving creates a record effective today. */
export function useGoalForm(
  initial: GoalFormInput,
  repo: Pick<GoalRepository, 'setFrom'>,
  today: LocalDate,
) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<GoalFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'saved' | 'failed'; text: string }>();

  const edit = (next: Partial<GoalFormInput>, clear: (keyof GoalFormErrors)[]) => {
    setValue((v) => ({ ...v, ...next }));
    setMessage(undefined);
    setErrors((e) =>
      Object.fromEntries(
        Object.entries(e).filter(([k]) => !clear.includes(k as keyof GoalFormErrors)),
      ),
    );
  };

  const kcal = parseDecimal(value.kcal);
  const gramsPreview =
    kcal !== null && kcal > 0 && isValidPercents(value.percents)
      ? (({ c, p, f }) => ({ c, p, f }))(gramsFromPercents(Math.round(kcal), value.percents))
      : undefined;
  const p = parseDecimal(value.p);
  const c = parseDecimal(value.c);
  const f = parseDecimal(value.f);
  const kcalPreview =
    p !== null && c !== null && f !== null
      ? goalFromGrams(Math.round(p), Math.round(c), Math.round(f)).kcal
      : undefined;

  return {
    value,
    errors,
    saving,
    message,
    preset: presetFor(value.percents),
    gramsPreview,
    kcalPreview,
    onMode: (mode: GoalFormInput['mode']) => {
      edit({ mode }, []);
    },
    onField: (field: 'kcal' | 'p' | 'c' | 'f', text: string) => {
      edit({ [field]: text }, [field]);
    },
    onPreset: (id: PresetId) => {
      const preset = MACRO_PRESETS.find((x) => x.id === id);
      if (preset) edit({ percents: { ...preset.percents } }, ['percents']);
    },
    onPercent: (key: keyof MacroPercents, n: number) => {
      edit({ percents: { ...value.percents, [key]: n } }, ['percents']);
    },
    onSubmit: async () => {
      const result = validateGoalForm(value);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setSaving(true);
      try {
        await repo.setFrom(today, result.value);
        setMessage({ kind: 'saved', text: 'Goals saved. They apply from today.' });
      } catch {
        setMessage({ kind: 'failed', text: GOAL_SAVE_FAILED });
      } finally {
        setSaving(false);
      }
    },
  };
}
