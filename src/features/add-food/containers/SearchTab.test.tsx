import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories } from '@/data/testing';
import type { Food } from '@/domain';
import { SearchTab } from './SearchTab';

const rice: Food = {
  key: 'usda:168878',
  source: 'usda',
  name: 'Rice, white, long-grain, regular, enriched, cooked',
  aliases: ['kanin', 'sinaing'],
  basis: { kind: '100g' },
  nutrients: { kcal: 130, p: 2.7, c: 28.2, f: 0.3 },
  portions: [{ label: '1 cup', grams: 158 }],
};
const egg: Food = {
  ...rice,
  key: 'usda:171287',
  name: 'Egg, whole, raw, fresh',
  aliases: ['itlog'],
  nutrients: { kcal: 143, p: 12.6, c: 0.7, f: 9.5 },
  portions: [{ label: '1 large', grams: 50 }],
};

function setup(repos = createTestRepositories(undefined, [rice, egg]).repos) {
  const onSelect = vi.fn<(f: Food) => void>();
  const onCreate = vi.fn<(name: string) => void>();
  render(<SearchTab repos={repos} onSelect={onSelect} onCreate={onCreate} />);
  return { repos, onSelect, onCreate };
}

describe('SearchTab', () => {
  it('finds bundled foods by Filipino name, with kcal for the default portion', async () => {
    const { onSelect } = setup();
    const input = screen.getByRole('searchbox', { name: 'Search foods' });
    expect(input).toHaveAttribute('enterkeyhint', 'search');
    await userEvent.type(input, 'kanin');
    const results = await screen.findByRole('list', { name: 'Search results' });
    const item = within(results).getByRole('button', { name: /Rice, white/ });
    expect(item).toHaveTextContent('Source: USDA 205 kcal · 1 cup (158 g)');
    expect(screen.getByRole('status')).toHaveTextContent('1 result');
    await userEvent.click(item);
    expect(onSelect).toHaveBeenCalledWith(rice);
  });

  it('says "Top 30" when results are capped', async () => {
    const many = Array.from({ length: 40 }, (_, i) => ({
      ...rice,
      key: `usda:${i}` as Food['key'],
      name: `Rice ${i}`,
    }));
    setup(createTestRepositories(undefined, many).repos);
    await userEvent.type(screen.getByRole('searchbox'), 'rice');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Top 30 results');
    });
  });

  it('tolerates typos', async () => {
    setup();
    await userEvent.type(screen.getByRole('searchbox'), 'itlgo');
    expect(await screen.findByRole('button', { name: /Egg, whole/ })).toBeInTheDocument();
  });

  it('lists your own foods first', async () => {
    const { repos } = createTestRepositories(undefined, [rice]);
    await repos.customFoods.create({
      name: 'Kanin ni Lola',
      aliases: [],
      basis: { kind: 'serving' },
      p: 4,
      c: 45,
      f: 0.5,
    });
    setup(repos);
    await userEvent.type(screen.getByRole('searchbox'), 'kanin');
    await waitFor(() => {
      expect(
        within(screen.getByRole('list', { name: 'Search results' })).getAllByRole('button'),
      ).toHaveLength(2);
    });
    const [first, second] = within(
      screen.getByRole('list', { name: 'Search results' }),
    ).getAllByRole('button');
    expect(first).toHaveTextContent('Kanin ni Lola');
    expect(first).toHaveTextContent('Source: Custom 201 kcal · 1 serving');
    expect(second).toHaveTextContent('Rice, white');
  });

  it('suggests another spelling or adding it, carrying the name', async () => {
    const { onCreate } = setup();
    await userEvent.type(screen.getByRole('searchbox'), 'dinuguan');
    expect(
      await screen.findByRole('heading', { name: 'No match for “dinuguan”' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 results');
    await userEvent.click(screen.getByRole('button', { name: 'Add it in Manual' }));
    expect(onCreate).toHaveBeenCalledWith('dinuguan');
  });

  it('says when the food list is loading or failed to load', async () => {
    const { repos } = createTestRepositories();
    let fail: (e: Error) => void = () => undefined;
    const failing = {
      ...repos,
      foods: {
        ready: () =>
          new Promise<never>((_, reject) => {
            fail = reject;
          }),
        search: () => Promise.resolve([]),
        get: () => Promise.resolve(undefined),
      },
    };
    setup(failing);
    expect(screen.getByRole('status')).toHaveTextContent('Loading the food list…');
    fail(
      new Error(
        'Couldn’t load the food list. Open Nouri once while online; after that it works offline.',
      ),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/Open Nouri once while online/);
  });
});
