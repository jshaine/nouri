import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { Repositories } from '@/data';
import { createTestRepositories, firstValue } from '@/data/testing';
import type { Food, LocalDate } from '@/domain';
import { SelectedFood } from './SelectedFood';

const TODAY = '2026-09-30' as LocalDate;
const rice: Food = {
  key: 'usda:1',
  source: 'usda',
  name: 'Rice',
  aliases: [],
  basis: { kind: '100g' },
  nutrients: { kcal: 130, p: 2.7, c: 28, f: 0.3 },
  portions: [{ label: '1 cup', grams: 158 }],
};

function Harness({
  repos,
  initial,
  onBack,
}: {
  repos: Repositories;
  initial: Food;
  onBack: () => void;
}) {
  const [food, setFood] = useState(initial);
  return (
    <SelectedFood
      food={food}
      date={TODAY}
      defaultMeal="lunch"
      repos={repos}
      onBack={onBack}
      onChanged={setFood}
      onAdded={vi.fn()}
    />
  );
}

describe('SelectedFood', () => {
  it('offers no Edit or Delete for bundled foods', () => {
    const { repos } = createTestRepositories();
    render(<Harness repos={repos} initial={rice} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('edits a custom food and shows the new numbers', async () => {
    const { repos } = createTestRepositories();
    const turon = await repos.customFoods.create({
      name: 'Turon',
      aliases: [],
      basis: { kind: 'serving' },
      p: 2,
      c: 40,
      f: 8,
    });
    render(<Harness repos={repos} initial={turon} onBack={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'This amount' })).toHaveTextContent('240 kcal');
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const fat = screen.getByLabelText('Fat');
    await userEvent.clear(fat);
    await userEvent.type(fat, '10');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'This amount' })).toHaveTextContent('258 kcal');
    });
  });

  it('can go back from editing without saving', async () => {
    const { repos } = createTestRepositories();
    const turon = await repos.customFoods.create({
      name: 'Turon',
      aliases: [],
      basis: { kind: 'serving' },
      p: 2,
      c: 40,
      f: 8,
    });
    render(<Harness repos={repos} initial={turon} onBack={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back without saving' }));
    expect(screen.getByRole('button', { name: 'Add to log' })).toBeInTheDocument();
  });

  it('deletes after confirming, and past entries keep their numbers', async () => {
    const { repos } = createTestRepositories();
    const turon = await repos.customFoods.create({
      name: 'Turon',
      aliases: [],
      basis: { kind: 'serving' },
      p: 2,
      c: 40,
      f: 8,
    });
    const logged = await repos.entries.add({
      date: TODAY,
      meal: 'snacks',
      foodKey: turon.key,
      amount: 1,
      unit: { kind: 'portion', label: '1 serving' },
      name: 'Turon',
      source: 'custom',
      totals: { kcal: 240, p: 2, c: 40, f: 8 },
    });
    const onBack = vi.fn();
    render(<Harness repos={repos} initial={turon} onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('group', { name: 'Delete “Turon”?' })).toHaveTextContent(
      'keep their numbers',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(await repos.customFoods.get('id-1')).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete food' }));
    await waitFor(() => {
      expect(onBack).toHaveBeenCalledOnce();
    });
    expect(await repos.customFoods.get('id-1')).toBeUndefined();
    expect((await firstValue(repos.entries.liveForDate(TODAY)))[0]).toEqual(logged);
  });

  it('explains a failed delete', async () => {
    const { repos } = createTestRepositories();
    const turon = await repos.customFoods.create({
      name: 'Turon',
      aliases: [],
      basis: { kind: 'serving' },
      p: 2,
      c: 40,
      f: 8,
    });
    const failing = {
      ...repos,
      customFoods: { ...repos.customFoods, remove: () => Promise.reject(new Error('blocked')) },
    };
    render(<Harness repos={failing} initial={turon} onBack={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete food' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/allows this site to store data/);
  });
});
