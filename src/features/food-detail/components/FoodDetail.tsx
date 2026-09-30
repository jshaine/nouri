import { Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { MEAL_NAME, MEALS, type FoodSource, type MacroTotals, type Meal } from '@/domain';
import {
  Button,
  IconButton,
  SegmentedControl,
  SelectField,
  SourceBadge,
  Stepper,
  type SelectOption,
} from '@/ui';
import { MacroPreview } from './MacroPreview';
import styles from './FoodDetail.module.css';

const MEAL_OPTIONS = MEALS.map((m) => ({ value: m, label: MEAL_NAME[m] }));

export interface FoodDetailProps {
  source: FoodSource;
  /** e.g. "Nutrition per 100 g", shown under the badge. */
  basisNote: string;
  unitOptions: readonly SelectOption[];
  unitId: string;
  onUnitChange: (id: string) => void;
  amount: number;
  amountStep: number;
  onAmountChange: (amount: number) => void;
  meal: Meal;
  onMealChange: (meal: Meal) => void;
  totals: MacroTotals;
  onAdd: () => void;
  /** undefined hides the star. */
  favorite?: boolean | undefined;
  onToggleFavorite?: () => void;
  /** Shows "Save portion" next to "Add to log". */
  onStartSavePortion?: (() => void) | undefined;
  /** The open Save portion form, if any. */
  portionForm?: ReactNode;
  adding?: boolean;
  error?: string | undefined;
}

/** Choose how much of a food, and when, with a live preview. */
export function FoodDetail(props: FoodDetailProps) {
  const { unitOptions, unitId, amount, meal, totals, adding = false, error } = props;
  const isGrams = unitId === 'g';
  return (
    <div className={styles.detail}>
      <div className={styles.metaRow}>
        <p className={styles.meta}>
          <SourceBadge source={props.source} />
          <span>{props.basisNote}</span>
        </p>
        {props.favorite !== undefined && (
          <IconButton
            icon={Star}
            label={props.favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={props.favorite}
            className={props.favorite ? styles.starred : undefined}
            onClick={props.onToggleFavorite}
          />
        )}
      </div>
      <div className={styles.amount}>
        <SelectField
          label="Portion"
          options={unitOptions}
          value={unitId}
          onChange={props.onUnitChange}
        />
        <div className={styles.quantity}>
          <span className={styles.quantityLabel} aria-hidden="true">
            {isGrams ? 'Grams' : 'Quantity'}
          </span>
          <Stepper
            label={isGrams ? 'Grams' : 'Quantity'}
            value={amount}
            step={props.amountStep}
            min={0}
            onChange={props.onAmountChange}
          />
        </div>
      </div>
      <SegmentedControl
        label="Meal"
        options={MEAL_OPTIONS}
        value={meal}
        onChange={props.onMealChange}
      />
      <MacroPreview totals={totals} />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {props.portionForm}
      <div className={styles.actions}>
        {props.onStartSavePortion && !props.portionForm && (
          <Button onClick={props.onStartSavePortion}>Save portion</Button>
        )}
        <Button variant="primary" disabled={adding || amount <= 0} onClick={props.onAdd}>
          {adding ? 'Adding…' : 'Add to log'}
        </Button>
      </div>
    </div>
  );
}
