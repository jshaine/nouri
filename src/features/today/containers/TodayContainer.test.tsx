import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createTestRepositories } from '@/data/testing';
import type { LocalDate, NewEntry } from '@/domain';
import { TodayContainer } from './TodayContainer';

const NOW = () => new Date(2026, 8, 30, 12);
const entry = (over: Partial<NewEntry>): NewEntry => ({
  date: '2026-09-30' as LocalDate,
  meal: 'lunch',
  foodKey: 'custom:a',
  amount: 1,
  unit: { kind: 'portion', label: '1 serving' },
  name: 'Adobo',
  source: 'custom',
  totals: { kcal: 290, p: 28, c: 4, f: 18 },
  ...over,
});

function setup(path = '/') {
  const { repos, tick } = createTestRepositories();
  const router = createMemoryRouter(
    [{ path: '/', element: <TodayContainer repos={repos} now={NOW} /> }],
    {
      initialEntries: [path],
    },
  );
  render(<RouterProvider router={router} />);
  return { repos, router, tick };
}

describe('TodayContainer', () => {
  it('invites a first log on an empty day and links to goals', async () => {
    setup();
    expect(
      await screen.findByRole('heading', { name: 'Nothing logged today' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set goals' })).toHaveAttribute('href', '/settings');
    expect(document.title).toBe('Today · Nouri');
  });

  it('groups entries by meal with per-meal totals and daily totals', async () => {
    const { repos, tick } = setup();
    await repos.goals.setFrom('2026-09-01' as LocalDate, {
      kcal: 2000,
      p: 100,
      c: 250,
      f: 67,
      macroMode: 'grams',
    });
    await repos.entries.add(entry({}));
    tick();
    await repos.entries.add(
      entry({ name: 'Kanin', source: 'usda', totals: { kcal: 205, p: 4, c: 45, f: 0.5 } }),
    );
    await repos.entries.add(
      entry({ meal: 'breakfast', name: 'Pandesal', totals: { kcal: 120, p: 3, c: 22, f: 2 } }),
    );

    const lunch = await screen.findByRole('region', { name: 'Lunch' });
    expect(within(lunch).getByText('495 kcal')).toBeInTheDocument();
    expect(
      within(lunch)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([expect.stringContaining('Adobo'), expect.stringContaining('Kanin')]);
    expect(
      within(screen.getByRole('region', { name: 'Dinner' })).getByText('Nothing yet'),
    ).toBeInTheDocument();
    const label = screen.getByRole('region', { name: 'Daily Facts' });
    expect(label).toHaveTextContent('Calories615');
    expect(label).toHaveTextContent('1,385 left');
  });

  it('moves between days through the URL, never into the future', async () => {
    const { repos, router } = setup();
    await repos.entries.add(entry({ date: '2026-09-29' as LocalDate, name: 'Sinigang' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(router.state.location.search).toBe('?date=2026-09-29');
    expect(await screen.findByText(/Sinigang/)).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(router.state.location.search).toBe('');
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('treats a future date in the URL as today', async () => {
    setup('/?date=2026-10-05');
    expect(await screen.findByRole('heading', { name: 'Food log for Today' })).toBeInTheDocument();
  });

  it('uses the goal that applied on a past day', async () => {
    const { repos } = setup('/?date=2026-09-10');
    await repos.goals.setFrom('2026-09-01' as LocalDate, {
      kcal: 2000,
      p: 1,
      c: 1,
      f: 1,
      macroMode: 'grams',
    });
    await repos.goals.setFrom('2026-09-20' as LocalDate, {
      kcal: 1800,
      p: 1,
      c: 1,
      f: 1,
      macroMode: 'grams',
    });
    expect(await screen.findByText('Goal 2,000')).toBeInTheDocument();
  });
});
