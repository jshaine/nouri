import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type {
  CustomFoodRepository,
  EntryRepository,
  PortionOverrideRepository,
  UsageRepository,
} from '@/data';
import {
  foodToCustomFoodInput,
  parseFoodKey,
  type Entry,
  type Food,
  type LocalDate,
  type Meal,
} from '@/domain';
import { FoodDetailContainer } from '@/features/food-detail';
import { Button } from '@/ui';
import { DeleteFoodConfirm } from '../components/DeleteFoodConfirm';
import { CustomFoodContainer } from './CustomFoodContainer';
import styles from './SelectedFood.module.css';

export const DELETE_FAILED =
  'Couldn’t delete it. Check that your browser allows this site to store data, then try again.';

interface SelectedFoodProps {
  food: Food;
  date: LocalDate;
  defaultMeal: Meal;
  repos: {
    entries: Pick<EntryRepository, 'add'>;
    usage: Pick<UsageRepository, 'isFavorite' | 'setFavorite'>;
    portionOverrides: Pick<PortionOverrideRepository, 'live' | 'save'>;
    customFoods: Pick<CustomFoodRepository, 'create' | 'update' | 'remove'>;
  };
  onBack: () => void;
  onChanged: (food: Food) => void;
  onAdded: (entry: Entry) => void;
}

/** A picked food: its detail, plus Edit and Delete for your own foods. */
export function SelectedFood({
  food,
  date,
  defaultMeal,
  repos,
  onBack,
  onChanged,
  onAdded,
}: SelectedFoodProps) {
  const [mode, setMode] = useState<'detail' | 'edit' | 'delete'>('detail');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const customId = food.source === 'custom' ? parseFoodKey(food.key)?.id : undefined;

  const remove = async () => {
    if (!customId) return;
    setDeleting(true);
    setError(undefined);
    try {
      await repos.customFoods.remove(customId);
      onBack();
    } catch {
      setError(DELETE_FAILED);
      setDeleting(false);
    }
  };

  if (mode === 'edit' && customId) {
    return (
      <div className={styles.view}>
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => {
            setMode('detail');
          }}
        >
          Back without saving
        </Button>
        <CustomFoodContainer
          repo={repos.customFoods}
          editing={{ id: customId, input: foodToCustomFoodInput(food) }}
          onSaved={(updated) => {
            setMode('detail');
            onChanged(updated);
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.bar}>
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>
          Back to foods
        </Button>
        {customId && mode === 'detail' && (
          <span className={styles.tools}>
            <Button
              variant="ghost"
              icon={Pencil}
              onClick={() => {
                setMode('edit');
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => {
                setMode('delete');
              }}
            >
              Delete
            </Button>
          </span>
        )}
      </div>
      {mode === 'delete' && (
        <DeleteFoodConfirm
          name={food.name}
          deleting={deleting}
          error={error}
          onCancel={() => {
            setMode('detail');
          }}
          onConfirm={() => {
            void remove();
          }}
        />
      )}
      <FoodDetailContainer
        key={food.key + JSON.stringify(food.nutrients)}
        food={food}
        date={date}
        initialMeal={defaultMeal}
        repo={repos.entries}
        usage={repos.usage}
        portions={repos.portionOverrides}
        onAdded={onAdded}
      />
    </div>
  );
}
