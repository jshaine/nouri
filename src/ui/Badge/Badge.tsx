import { FOOD_SOURCE_DESCRIPTION, FOOD_SOURCE_LABEL, type FoodSource } from '@/domain';
import styles from './Badge.module.css';

export interface SourceBadgeProps {
  source: FoodSource;
}

/** Small outlined chip naming where a food's numbers come from. */
export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <span className={styles.badge} data-source={source} title={FOOD_SOURCE_DESCRIPTION[source]}>
      <span className="visually-hidden">Source:</span> {FOOD_SOURCE_LABEL[source]}
    </span>
  );
}
