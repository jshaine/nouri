import { useState } from 'react';
import type { CustomFoodRepository, FoodDatabase } from '@/data';
import {
  EMPTY_CUSTOM_FOOD,
  foodToCustomFoodInput,
  type CustomFoodInput,
  type Food,
} from '@/domain';
import { CustomFoodForm } from '../components/CustomFoodForm';
import { useCustomFoodForm } from '../hooks/useCustomFoodForm';
import { ReferencePicker } from './ReferencePicker';

export interface CustomFoodContainerProps {
  repo: Pick<CustomFoodRepository, 'create' | 'update'>;
  editing?: { id: string; input: CustomFoodInput };
  /** Fills the name if it's still empty (e.g. the text searched for). */
  suggestedName?: string;
  /** Enables "Start from a similar food" (new foods only). */
  reference?: { foods: FoodDatabase; customFoods: Pick<CustomFoodRepository, 'live'> };
  onSaved: (food: Food) => void;
}

/** Create or edit a custom food (the Manual tab, and "Edit" on My foods). */
export function CustomFoodContainer({
  repo,
  editing,
  suggestedName,
  reference,
  onSaved,
}: CustomFoodContainerProps) {
  const form = useCustomFoodForm({ repo, editing, onSaved, suggestedName });
  const [picked, setPicked] = useState<Food>();
  return (
    <>
      {reference && !editing && (
        <ReferencePicker
          repos={reference}
          picked={picked}
          onPick={(food) => {
            setPicked(food);
            form.fillFrom(foodToCustomFoodInput(food));
          }}
          onClear={() => {
            // Clears the copied facts too; the name stays.
            setPicked(undefined);
            form.fillFrom(EMPTY_CUSTOM_FOOD);
          }}
        />
      )}
      <CustomFoodForm
        value={form.value}
        errors={form.errors}
        onChange={form.onChange}
        onSubmit={() => {
          void form.onSubmit();
        }}
        submitLabel={editing ? 'Save changes' : 'Save food'}
        saving={form.saving}
        saveError={form.saveError}
      />
    </>
  );
}
