import type { EntryRepository, UsageRepository } from '@/data';
import type { Entry, Food, LocalDate, Meal, Portion } from '@/domain';
import { useLive } from '@/ui';
import { FoodDetail } from '../components/FoodDetail';
import { useFoodDetail } from '../hooks/useFoodDetail';

export interface FoodDetailContainerProps {
  food: Food;
  overrides?: readonly Portion[];
  date: LocalDate;
  initialMeal?: Meal;
  repo: Pick<EntryRepository, 'add'>;
  /** Enables the favorite star. */
  usage?: Pick<UsageRepository, 'isFavorite' | 'setFavorite'>;
  onAdded: (entry: Entry) => void;
}

export function basisNote(food: Food): string {
  if (food.basis.kind === '100g') return 'Nutrition per 100 g';
  return food.basis.servingGrams === undefined
    ? 'Nutrition per serving'
    : `Nutrition per serving (${food.basis.servingGrams} g)`;
}

/** Portion, quantity and meal for one food, then "Add to log". */
export function FoodDetailContainer(props: FoodDetailContainerProps) {
  const detail = useFoodDetail(props);
  const { usage, food } = props;
  const favorite = useLive(
    () => usage?.isFavorite(food.key) ?? { subscribe: () => ({ unsubscribe: () => undefined }) },
    [usage, food.key],
  );
  return (
    <FoodDetail
      source={food.source}
      basisNote={basisNote(food)}
      favorite={usage ? (favorite.value ?? false) : undefined}
      onToggleFavorite={() => {
        void usage?.setFavorite(food.key, !(favorite.value ?? false));
      }}
      {...detail}
      onAdd={() => {
        void detail.onAdd();
      }}
    />
  );
}
