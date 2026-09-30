import type { CustomFoodRepository } from '@/data';
import type { CustomFoodInput, Food } from '@/domain';
import { CustomFoodForm } from '../components/CustomFoodForm';
import { useCustomFoodForm } from '../hooks/useCustomFoodForm';

export interface CustomFoodContainerProps {
  repo: Pick<CustomFoodRepository, 'create' | 'update'>;
  editing?: { id: string; input: CustomFoodInput };
  /** Fills the name if it's still empty (e.g. the text searched for). */
  suggestedName?: string;
  onSaved: (food: Food) => void;
}

/** Create or edit a custom food (the Manual tab, and "Edit" on My foods). */
export function CustomFoodContainer({
  repo,
  editing,
  suggestedName,
  onSaved,
}: CustomFoodContainerProps) {
  const form = useCustomFoodForm({ repo, editing, onSaved, suggestedName });
  return (
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
  );
}
