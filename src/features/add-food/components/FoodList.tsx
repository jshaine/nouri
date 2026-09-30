import { ChevronRight } from 'lucide-react';
import { caloriesOf, formatNumber, type Food } from '@/domain';
import { SourceBadge } from '@/ui';
import styles from './FoodList.module.css';

export interface FoodListProps {
  foods: readonly Food[];
  onSelect: (food: Food) => void;
  /** Accessible name for the list, e.g. "Your foods". */
  label: string;
  /** Second line after the badge; defaults to kcal for the food's basis. */
  describe?: (food: Food) => string;
}

function per(food: Food): string {
  return food.basis.kind === '100g' ? 'per 100 g' : 'per serving';
}

/** Tappable foods with source and calories for their basis. */
const basisKcal = (food: Food) => `${formatNumber(caloriesOf(food.nutrients))} kcal ${per(food)}`;

export function FoodList({ foods, onSelect, label, describe = basisKcal }: FoodListProps) {
  return (
    <ul className={styles.list} aria-label={label}>
      {foods.map((food) => (
        <li key={food.key}>
          <button
            type="button"
            className={styles.item}
            onClick={() => {
              onSelect(food);
            }}
          >
            <span className={styles.main}>
              <span className={styles.name}>{food.name}</span>{' '}
              <span className={styles.meta}>
                <SourceBadge source={food.source} /> {describe(food)}
              </span>
            </span>
            <ChevronRight className={styles.chevron} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
