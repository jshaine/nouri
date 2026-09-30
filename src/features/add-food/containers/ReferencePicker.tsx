import { X } from 'lucide-react';
import { useState } from 'react';
import type { CustomFoodRepository, FoodDatabase } from '@/data';
import { FOOD_SOURCE_LABEL, type Food } from '@/domain';
import { Button, TextField } from '@/ui';
import { describeFood } from '../components/describeFood';
import { FoodList } from '../components/FoodList';
import { useFoodSearch } from '../hooks/useFoodSearch';
import styles from './ReferencePicker.module.css';

/** Top matches only: this is a starting point, not full search. */
const REFERENCE_RESULTS = 5;

interface ReferencePickerProps {
  repos: { foods: FoodDatabase; customFoods: Pick<CustomFoodRepository, 'live'> };
  picked: Food | undefined;
  onPick: (food: Food) => void;
  onClear: () => void;
}

/** "Start from a similar food": search the database and copy its facts into the form. */
export function ReferencePicker({ repos, picked, onPick, onClear }: ReferencePickerProps) {
  const [query, setQuery] = useState('');
  const search = useFoodSearch(repos, query);
  const results = search.results.slice(0, REFERENCE_RESULTS);

  if (picked) {
    return (
      <div className={styles.picked} role="status">
        <p>
          Based on <b>{picked.name}</b> ({FOOD_SOURCE_LABEL[picked.source]}), per 100 g. Change
          anything you need.
        </p>
        <Button variant="ghost" icon={X} onClick={onClear}>
          Clear
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.picker}>
      <TextField
        label="Start from a similar food (optional)"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        placeholder="rice, chicken breast, banana"
        hint="Pick one to copy its nutrition facts, then adjust them."
        value={query}
        onChange={setQuery}
      />
      {query.trim() !== '' && results.length > 0 && (
        <FoodList
          label="Similar foods"
          foods={results}
          describe={describeFood}
          onSelect={(food) => {
            setQuery('');
            onPick(food);
          }}
        />
      )}
      {query.trim() !== '' &&
        search.status === 'ready' &&
        !search.pending &&
        results.length === 0 && (
          <p className={styles.none}>
            No similar food found. You can still enter the facts yourself below.
          </p>
        )}
    </div>
  );
}
