import { useState } from 'react';
import type { PortionOverrideRepository } from '@/data';
import {
  portionKind,
  validatePortion,
  type Food,
  type Portion,
  type PortionErrors,
} from '@/domain';

export const PORTION_SAVE_FAILED =
  'Couldn’t save the portion. Check that your browser allows this site to store data, then try again.';

/** State for "Save portion": open with a prefilled amount, validate, save as an override. */
export function useSavePortion(
  food: Food,
  repo: Pick<PortionOverrideRepository, 'save'> | undefined,
  onSaved: (portion: Portion) => void,
) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<PortionErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const close = () => {
    setOpen(false);
    setLabel('');
    setErrors({});
    setSaveError(undefined);
  };

  return {
    available: repo !== undefined,
    open,
    kind: portionKind(food),
    label,
    amount,
    errors,
    saving,
    saveError,
    start: (prefill: number) => {
      setAmount(prefill > 0 ? String(prefill) : '');
      setOpen(true);
    },
    onLabel: (v: string) => {
      setLabel(v);
      setErrors((e) => ({ ...e, label: undefined }));
    },
    onAmount: (v: string) => {
      setAmount(v);
      setErrors((e) => ({ ...e, amount: undefined }));
    },
    onCancel: close,
    onSave: async () => {
      if (!repo) return;
      const result = validatePortion(food, label, amount);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setSaving(true);
      try {
        await repo.save(food.key, result.value);
        close();
        onSaved(result.value);
      } catch {
        setSaveError(PORTION_SAVE_FAILED);
      } finally {
        setSaving(false);
      }
    },
  };
}
