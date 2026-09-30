import { useMemo, useState } from 'react';
import type { EntryRepository } from '@/data';
import {
  defaultAmount,
  defaultChoice,
  mealForTime,
  nutrientsFor,
  optionForUnit,
  stepFor,
  unitOptions,
  availablePortions,
  type Entry,
  type Food,
  type LocalDate,
  type Meal,
  type Portion,
} from '@/domain';

export const ADD_FAILED =
  'Couldn’t add this to your log. Check that your browser allows this site to store data, then try again.';

interface Options {
  food: Food;
  overrides?: readonly Portion[];
  date: LocalDate;
  /** Meal to preselect; defaults by time of day. */
  initialMeal?: Meal;
  repo: Pick<EntryRepository, 'add'>;
  onAdded: (entry: Entry) => void;
  now?: () => Date;
}

export function useFoodDetail({
  food,
  overrides = [],
  date,
  initialMeal,
  repo,
  onAdded,
  now = () => new Date(),
}: Options) {
  const options = useMemo(() => unitOptions(food, overrides), [food, overrides]);
  const portions = useMemo(() => availablePortions(food, overrides), [food, overrides]);
  const [picked, setChoice] = useState(() => defaultChoice(food, overrides));
  // If the picked portion isn't available (yet), fall back instead of failing.
  const choice = optionForUnit(options, picked.unit) ? picked : defaultChoice(food, overrides);
  const [meal, setMeal] = useState<Meal>(() => initialMeal ?? mealForTime(now()));
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string>();

  const unitId = optionForUnit(options, choice.unit)?.id ?? '';
  const totals = nutrientsFor(food, portions, choice.amount, choice.unit);

  const onUnitChange = (id: string) => {
    const option = options.find((o) => o.id === id);
    if (option) setChoice({ unit: option.unit, amount: defaultAmount(food, option.unit) });
  };

  const onAdd = async () => {
    if (!(choice.amount > 0)) return;
    setAdding(true);
    setError(undefined);
    try {
      const entry = await repo.add({
        date,
        meal,
        foodKey: food.key,
        amount: choice.amount,
        unit: choice.unit,
        name: food.name,
        source: food.source,
        totals,
      });
      onAdded(entry);
    } catch {
      setError(ADD_FAILED);
    } finally {
      setAdding(false);
    }
  };

  return {
    unitOptions: options.map((o) => ({ value: o.id, label: o.label })),
    unitId,
    onUnitChange,
    amount: choice.amount,
    amountStep: stepFor(choice.unit),
    onAmountChange: (amount: number) => {
      setChoice((c) => ({ ...c, amount }));
    },
    meal,
    onMealChange: setMeal,
    totals,
    adding,
    error,
    onAdd,
    /** Current selection, for prefilling "Save portion". */
    selection: { portions, amount: choice.amount, unit: choice.unit },
    /** Switch to a portion (e.g. one just saved), one of it. */
    selectPortion: (label: string) => {
      setChoice({ unit: { kind: 'portion', label }, amount: 1 });
    },
  };
}
