import { useEffect, useState } from 'react';
import type { FoodDatabase } from '@/data';

/** The credit lines of the bundled food data that's actually loaded. */
export function useFoodSources(foods: Pick<FoodDatabase, 'ready'>): string[] | undefined {
  const [sources, setSources] = useState<string[]>();
  useEffect(() => {
    let active = true;
    foods.ready().then(
      (info) => {
        if (active)
          setSources([info.sources.usda, info.sources.fnri].filter((s): s is string => Boolean(s)));
      },
      () => {
        if (active) setSources([]);
      },
    );
    return () => {
      active = false;
    };
  }, [foods]);
  return sources;
}
