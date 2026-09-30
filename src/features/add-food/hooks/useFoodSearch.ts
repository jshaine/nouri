import { useEffect, useMemo, useRef, useState } from 'react';
import type { CustomFoodRepository, FoodDatabase } from '@/data';
import { createFoodSearch, DEFAULT_RESULT_LIMIT, type Food } from '@/domain';
import { useLive } from '@/ui';

export type SearchStatus = 'loading' | 'ready' | 'error';

interface Repos {
  foods: FoodDatabase;
  customFoods: Pick<CustomFoodRepository, 'live'>;
}

/**
 * Searches your foods (first) and the bundled database as you type. Answers
 * to older keystrokes are dropped so results never jump back.
 */
export function useFoodSearch(repos: Repos, query: string) {
  const [status, setStatus] = useState<SearchStatus>('loading');
  const [error, setError] = useState<string>();
  const [bundled, setBundled] = useState<{ query: string; foods: Food[] }>({
    query: '',
    foods: [],
  });
  const latest = useRef(0);

  useEffect(() => {
    let active = true;
    repos.foods.ready().then(
      () => {
        if (active) setStatus('ready');
      },
      (e: unknown) => {
        if (!active) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : String(e));
      },
    );
    return () => {
      active = false;
    };
  }, [repos.foods]);

  useEffect(() => {
    const q = query.trim();
    const id = (latest.current += 1);
    if (!q || status !== 'ready') return;
    void repos.foods.search(q).then((foods) => {
      if (id === latest.current) setBundled({ query: q, foods });
    });
  }, [repos.foods, query, status]);

  const custom = useLive(() => repos.customFoods.live(), [repos.customFoods]);
  const customIndex = useMemo(() => createFoodSearch(custom.value ?? []), [custom.value]);

  const q = query.trim();
  const mine = q ? customIndex.search(q, DEFAULT_RESULT_LIMIT) : [];
  const theirs = q && bundled.query === q ? bundled.foods : [];
  return {
    status,
    error,
    /** True while the latest query hasn't come back yet. */
    pending: q !== '' && status === 'ready' && bundled.query !== q,
    results: [...mine, ...theirs].slice(0, DEFAULT_RESULT_LIMIT),
  };
}
