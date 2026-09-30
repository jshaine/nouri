import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories } from '@/data/testing';
import type { Food } from '@/domain';
import { RecentTab } from './RecentTab';

const rice: Food = {
  key: 'usda:1',
  source: 'usda',
  name: 'Rice, white, cooked',
  aliases: ['kanin'],
  basis: { kind: '100g' },
  nutrients: { kcal: 130, p: 2.7, c: 28, f: 0.3 },
  portions: [{ label: '1 cup', grams: 158 }],
};
const egg: Food = {
  ...rice,
  key: 'usda:2',
  name: 'Egg, whole',
  portions: [{ label: '1 large', grams: 50 }],
};

describe('RecentTab', () => {
  it('invites you to log first', async () => {
    const { repos } = createTestRepositories(undefined, [rice]);
    render(<RecentTab repos={repos} onSelect={vi.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Nothing here yet' })).toBeInTheDocument();
  });

  it('shows favorites first, then recents without repeating them, skipping deleted foods', async () => {
    const { repos, tick } = createTestRepositories(undefined, [rice, egg]);
    const gone = await repos.customFoods.create({
      name: 'Old recipe',
      aliases: [],
      basis: { kind: 'serving' },
      p: 1,
      c: 1,
      f: 1,
    });
    for (const key of ['usda:1', gone.key, 'usda:2'] as const) {
      await repos.usage.recordUse(key);
      tick();
    }
    await repos.usage.setFavorite('usda:1', true);
    await repos.customFoods.remove(gone.key.slice('custom:'.length));

    const onSelect = vi.fn();
    render(<RecentTab repos={repos} onSelect={onSelect} />);
    const favorites = await screen.findByRole('list', { name: 'Favorites' });
    expect(
      within(favorites)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual([expect.stringContaining('Rice, white, cooked')]);
    const recent = screen.getByRole('list', { name: 'Recent' });
    expect(
      within(recent)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual([expect.stringContaining('Egg, whole')]);
    expect(within(recent).getByRole('button')).toHaveTextContent('kcal · 1 large (50 g)');
    await userEvent.click(within(recent).getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(egg);
  });

  it('updates live when a food is starred', async () => {
    const { repos } = createTestRepositories(undefined, [rice]);
    await repos.usage.recordUse('usda:1');
    render(<RecentTab repos={repos} onSelect={vi.fn()} />);
    expect(await screen.findByRole('list', { name: 'Recent' })).toBeInTheDocument();
    await repos.usage.setFavorite('usda:1', true);
    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'Favorites' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('list', { name: 'Recent' })).not.toBeInTheDocument();
  });
});
