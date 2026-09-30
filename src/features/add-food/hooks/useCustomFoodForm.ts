import { useState } from 'react';
import type { CustomFoodRepository } from '@/data';
import {
  EMPTY_CUSTOM_FOOD,
  validateCustomFood,
  type CustomFoodErrors,
  type CustomFoodInput,
  type Food,
} from '@/domain';

export const SAVE_FAILED =
  'Couldn’t save this food. Check that your browser allows this site to store data, then try again.';

interface Options {
  repo: Pick<CustomFoodRepository, 'create' | 'update'>;
  /** Editing: the food's id and its current values. */
  editing?: { id: string; input: CustomFoodInput };
  onSaved: (food: Food) => void;
  suggestedName?: string | undefined;
}

/** Form state for creating or editing a custom food. Input survives failed saves. */
export function useCustomFoodForm({ repo, editing, onSaved, suggestedName }: Options) {
  const [value, setValue] = useState<CustomFoodInput>(
    () => editing?.input ?? { ...EMPTY_CUSTOM_FOOD, name: suggestedName ?? '' },
  );
  const [errors, setErrors] = useState<CustomFoodErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  // A new suggestion fills the name only if it's empty: never overwrite typing.
  const [seenSuggestion, setSeenSuggestion] = useState(suggestedName);
  if (suggestedName !== seenSuggestion) {
    setSeenSuggestion(suggestedName);
    if (suggestedName && !value.name) setValue({ ...value, name: suggestedName });
  }

  const onChange = <K extends keyof CustomFoodInput>(field: K, next: CustomFoodInput[K]) => {
    setValue((v) => ({ ...v, [field]: next }));
    // Clear a field's error as soon as it is edited.
    if (field in errors) {
      setErrors((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([key]) => key !== field)),
      );
    }
  };

  const onSubmit = async () => {
    const result = validateCustomFood(value);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaveError(undefined);
    setSaving(true);
    try {
      const food = editing
        ? await repo.update(editing.id, result.value)
        : await repo.create(result.value);
      onSaved(food);
    } catch {
      setSaveError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  return { value, errors, saving, saveError, onChange, onSubmit };
}
