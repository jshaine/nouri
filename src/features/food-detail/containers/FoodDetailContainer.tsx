import { useMemo, useState } from 'react';
import type { EntryRepository, PortionOverrideRepository, UsageRepository } from '@/data';
import {
  selectionAsPortionAmount,
  upsertPortion,
  type Entry,
  type Food,
  type LocalDate,
  type Meal,
  type Portion,
} from '@/domain';
import { useLive } from '@/ui';
import { FoodDetail } from '../components/FoodDetail';
import { SavePortionForm } from '../components/SavePortionForm';
import { useFoodDetail } from '../hooks/useFoodDetail';
import { useSavePortion } from '../hooks/useSavePortion';

export interface FoodDetailContainerProps {
  food: Food;
  overrides?: readonly Portion[];
  date: LocalDate;
  initialMeal?: Meal;
  repo: Pick<EntryRepository, 'add'>;
  /** Enables the favorite star. */
  usage?: Pick<UsageRepository, 'isFavorite' | 'setFavorite'>;
  /** Enables "Save portion" and your saved portions. */
  portions?: Pick<PortionOverrideRepository, 'live' | 'save'>;
  onAdded: (entry: Entry) => void;
}

const EMPTY: readonly Portion[] = [];

export function basisNote(food: Food): string {
  // Label foods are typed in by volunteers: worth a glance at the pack.
  if (food.source === 'off')
    return 'Per 100 g, from the package label. Check it against your pack.';
  if (food.basis.kind === '100g') return 'Nutrition per 100 g';
  return food.basis.servingGrams === undefined
    ? 'Nutrition per serving'
    : `Nutrition per serving (${food.basis.servingGrams} g)`;
}

/** Portion, quantity and meal for one food, then "Add to log". */
export function FoodDetailContainer(props: FoodDetailContainerProps) {
  const { usage, food, portions } = props;
  const none = { subscribe: () => ({ unsubscribe: () => undefined }) };
  const overrides = useLive(() => portions?.live(food.key) ?? none, [portions, food.key]);
  // A just-saved portion is usable at once, before the live list catches up.
  const [justSaved, setJustSaved] = useState<Portion[]>([]);
  const allOverrides = useMemo(
    () =>
      justSaved.reduce<Portion[]>(
        (list, p) => upsertPortion(list, p),
        [...(overrides.value ?? EMPTY)],
      ),
    [overrides.value, justSaved],
  );
  const detail = useFoodDetail({ ...props, overrides: allOverrides });
  const save = useSavePortion(food, portions, (portion) => {
    setJustSaved((list) => [...list, portion]);
    detail.selectPortion(portion.label);
  });
  const favorite = useLive(() => usage?.isFavorite(food.key) ?? none, [usage, food.key]);
  return (
    <FoodDetail
      source={food.source}
      basisNote={basisNote(food)}
      favorite={usage ? (favorite.value ?? false) : undefined}
      onToggleFavorite={() => {
        void usage?.setFavorite(food.key, !(favorite.value ?? false));
      }}
      onStartSavePortion={
        save.available
          ? () => {
              const { portions: list, amount, unit } = detail.selection;
              save.start(selectionAsPortionAmount(food, list, amount, unit));
            }
          : undefined
      }
      portionForm={
        save.open ? (
          <SavePortionForm
            {...save}
            onSave={() => {
              void save.onSave();
            }}
          />
        ) : undefined
      }
      {...detail}
      onAdd={() => {
        void detail.onAdd();
      }}
    />
  );
}
