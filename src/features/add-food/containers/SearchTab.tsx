import { SearchX } from 'lucide-react';
import { useState } from 'react';
import type { CustomFoodRepository, FoodDatabase } from '@/data';
import { DEFAULT_RESULT_LIMIT, type Food } from '@/domain';
import { Button, EmptyState, TextField } from '@/ui';
import { describeFood } from '../components/describeFood';
import { FoodList } from '../components/FoodList';
import { useFoodSearch } from '../hooks/useFoodSearch';
import styles from './SearchTab.module.css';

interface SearchTabProps {
  repos: { foods: FoodDatabase; customFoods: Pick<CustomFoodRepository, 'live'> };
  onSelect: (food: Food) => void;
  /** No match: offer to create it, carrying the typed name. */
  onCreate: (name: string) => void;
}

export function SearchTab({ repos, onSelect, onCreate }: SearchTabProps) {
  const [query, setQuery] = useState('');
  const search = useFoodSearch(repos, query);
  const q = query.trim();

  const count = search.results.length;
  let status = '';
  if (search.status === 'loading') status = 'Loading the food list…';
  else if (q && !search.pending) {
    // Results are capped; "Top 30" is honest when there are more.
    status =
      count === DEFAULT_RESULT_LIMIT
        ? `Top ${count} results`
        : `${count} ${count === 1 ? 'result' : 'results'}`;
  }

  return (
    <div className={styles.tab}>
      <TextField
        label="Search foods"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="rice, chicken breast, banana"
        value={query}
        onChange={setQuery}
      />
      <p
        className={styles.status}
        role="status"
        aria-live="polite"
        aria-busy={search.status === 'loading' || search.pending}
      >
        {status}
      </p>
      {search.status === 'error' && (
        <p className={styles.error} role="alert">
          {search.error}
        </p>
      )}
      <div className={styles.results}>
        {search.results.length > 0 && (
          <FoodList
            label="Search results"
            foods={search.results}
            onSelect={onSelect}
            describe={describeFood}
          />
        )}
        {q && search.status === 'ready' && !search.pending && search.results.length === 0 && (
          <EmptyState
            icon={SearchX}
            title={`No match for “${q}”`}
            action={
              <Button
                onClick={() => {
                  onCreate(q);
                }}
              >
                Add it in Manual
              </Button>
            }
          >
            Try another spelling or a simpler word, like “rice” or “chicken”.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
