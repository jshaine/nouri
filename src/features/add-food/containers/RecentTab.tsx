import { History } from 'lucide-react';
import { useId } from 'react';
import type { CustomFoodRepository, FoodDatabase, UsageRepository } from '@/data';
import type { Food } from '@/domain';
import { EmptyState } from '@/ui';
import { describeFood } from '../components/describeFood';
import { FoodList } from '../components/FoodList';
import { useUsageFoods } from '../hooks/useUsageFoods';
import styles from './RecentTab.module.css';

interface RecentTabProps {
  repos: {
    usage: Pick<UsageRepository, 'liveRecents' | 'liveFavorites'>;
    customFoods: Pick<CustomFoodRepository, 'get'>;
    foods: Pick<FoodDatabase, 'get'>;
  };
  onSelect: (food: Food) => void;
}

/** Starred foods first, then recently logged ones. */
export function RecentTab({ repos, onSelect }: RecentTabProps) {
  const foods = useUsageFoods(repos);
  const id = useId();
  if (!foods) return null;
  if (foods.favorites.length === 0 && foods.recents.length === 0) {
    return (
      <EmptyState icon={History} title="Nothing here yet">
        Foods you log show up here, so you can add them again in one tap. Star a food to keep it at
        the top.
      </EmptyState>
    );
  }
  return (
    <div className={styles.tab}>
      {foods.favorites.length > 0 && (
        <section aria-labelledby={`${id}-favorites`}>
          <h3 id={`${id}-favorites`} className={styles.heading}>
            Favorites
          </h3>
          <FoodList
            label="Favorites"
            foods={foods.favorites}
            onSelect={onSelect}
            describe={describeFood}
          />
        </section>
      )}
      {foods.recents.length > 0 && (
        <section aria-labelledby={`${id}-recent`}>
          <h3 id={`${id}-recent`} className={styles.heading}>
            Recent
          </h3>
          <FoodList
            label="Recent"
            foods={foods.recents}
            onSelect={onSelect}
            describe={describeFood}
          />
        </section>
      )}
    </div>
  );
}
