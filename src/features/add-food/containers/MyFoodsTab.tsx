import { NotebookPen } from 'lucide-react';
import type { CustomFoodRepository } from '@/data';
import type { Food } from '@/domain';
import { Button, EmptyState, useLive } from '@/ui';
import { FoodList } from '../components/FoodList';

interface MyFoodsTabProps {
  repo: Pick<CustomFoodRepository, 'live'>;
  onSelect: (food: Food) => void;
  onCreate: () => void;
}

export function MyFoodsTab({ repo, onSelect, onCreate }: MyFoodsTabProps) {
  const foods = useLive(() => repo.live(), [repo]);
  if (foods.value === undefined) return null;
  if (foods.value.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No foods of your own yet"
        action={
          <Button variant="primary" onClick={onCreate}>
            Add a food
          </Button>
        }
      >
        Add a home recipe or anything with a label, and it will show here.
      </EmptyState>
    );
  }
  return <FoodList label="Your foods" foods={foods.value} onSelect={onSelect} />;
}
