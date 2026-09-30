import { useState } from 'react';
import type {
  CustomFoodRepository,
  EntryRepository,
  FoodDatabase,
  PortionOverrideRepository,
  UsageRepository,
} from '@/data';
import type { Entry, Food, LocalDate, Meal } from '@/domain';
import { Sheet, Tabs } from '@/ui';
import { CustomFoodContainer } from './CustomFoodContainer';
import { MyFoodsTab } from './MyFoodsTab';
import { SelectedFood } from './SelectedFood';
import { RecentTab } from './RecentTab';
import { SearchTab } from './SearchTab';

const TABS = [
  { id: 'search', label: 'Search' },
  { id: 'recent', label: 'Recent' },
  { id: 'mine', label: 'My foods' },
  { id: 'manual', label: 'Manual' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export interface AddFoodSheetProps {
  open: boolean;
  onClose: () => void;
  date: LocalDate;
  /** Meal preselected in the food detail (time of day). */
  defaultMeal: Meal;
  repos: {
    foods: FoodDatabase;
    customFoods: Pick<CustomFoodRepository, 'live' | 'get' | 'create' | 'update' | 'remove'>;
    entries: Pick<EntryRepository, 'add'>;
    usage: Pick<UsageRepository, 'liveRecents' | 'liveFavorites' | 'isFavorite' | 'setFavorite'>;
    portionOverrides: Pick<PortionOverrideRepository, 'live' | 'save'>;
  };
  onAdded: (entry: Entry) => void;
}

/**
 * Find or create a food, then pick the amount. Closing keeps what was typed
 * (the sheet stays mounted); a finished add starts fresh next time.
 */
export function AddFoodSheet({
  open,
  onClose,
  date,
  defaultMeal,
  repos,
  onAdded,
}: AddFoodSheetProps) {
  const [tab, setTab] = useState<TabId>('search');
  const [suggestedName, setSuggestedName] = useState('');
  const [selected, setSelected] = useState<Food>();
  const [formKey, setFormKey] = useState(0);

  const added = (entry: Entry) => {
    setSelected(undefined);
    setTab('search');
    setSuggestedName('');
    setFormKey((k) => k + 1);
    onAdded(entry);
  };

  return (
    <Sheet open={open} onClose={onClose} title={selected ? selected.name : 'Add food'}>
      {selected && (
        <SelectedFood
          food={selected}
          date={date}
          defaultMeal={defaultMeal}
          repos={repos}
          onBack={() => {
            setSelected(undefined);
          }}
          onChanged={setSelected}
          onAdded={added}
        />
      )}
      {/* Stays mounted while a food is open, so a half-typed Manual form survives. */}
      <div hidden={selected !== undefined}>
        <Tabs label="Find a food" tabs={TABS} value={tab} onChange={setTab}>
          <div hidden={tab !== 'search'}>
            <SearchTab
              repos={repos}
              onSelect={setSelected}
              onCreate={(name) => {
                setSuggestedName(name);
                setTab('manual');
              }}
            />
          </div>
          {tab === 'recent' && <RecentTab repos={repos} onSelect={setSelected} />}
          {tab === 'mine' && (
            <MyFoodsTab
              repo={repos.customFoods}
              onSelect={setSelected}
              onCreate={() => {
                setTab('manual');
              }}
            />
          )}
          <div hidden={tab !== 'manual'}>
            <CustomFoodContainer
              key={formKey}
              repo={repos.customFoods}
              suggestedName={suggestedName}
              reference={repos}
              onSaved={setSelected}
            />
          </div>
        </Tabs>
      </div>
    </Sheet>
  );
}
