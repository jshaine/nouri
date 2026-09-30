import type { EntryRepository } from '@/data';
import type { Entry, Food, LocalDate, Meal, Portion } from '@/domain';
import { FoodDetail } from '../components/FoodDetail';
import { useFoodDetail } from '../hooks/useFoodDetail';

export interface FoodDetailContainerProps {
  food: Food;
  overrides?: readonly Portion[];
  date: LocalDate;
  initialMeal?: Meal;
  repo: Pick<EntryRepository, 'add'>;
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
  return (
    <FoodDetail
      source={props.food.source}
      basisNote={basisNote(props.food)}
      {...detail}
      onAdd={() => {
        void detail.onAdd();
      }}
    />
  );
}
