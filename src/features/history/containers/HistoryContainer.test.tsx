import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createTestRepositories } from '@/data/testing';
import type { LocalDate, NewEntry } from '@/domain';
import { HistoryContainer } from './HistoryContainer';

const NOW = () => new Date(2026, 8, 30, 12); // Wednesday
const entry = (date: string, kcal: number): NewEntry => ({
  date: date as LocalDate,
  meal: 'lunch',
  foodKey: 'custom:a',
  amount: 1,
  unit: { kind: 'portion', label: '1 serving' },
  name: 'x',
  source: 'custom',
  totals: { kcal, p: 50, c: 100, f: 30 },
});

async function setup(path = '/history') {
  const { repos } = createTestRepositories();
  await repos.goals.setFrom('2026-09-01' as LocalDate, {
    kcal: 2000,
    p: 1,
    c: 1,
    f: 1,
    macroMode: 'grams',
  });
  await repos.entries.add(entry('2026-09-28', 1800));
  await repos.entries.add(entry('2026-09-30', 2200));
  await repos.entries.add(entry('2026-09-21', 1500));
  const router = createMemoryRouter(
    [{ path: '/history', element: <HistoryContainer repos={repos} now={NOW} /> }],
    {
      initialEntries: [path],
    },
  );
  render(<RouterProvider router={router} />);
  return { repos, router };
}

describe('HistoryContainer', () => {
  it('shows this week as linked bars with goals, and future days as not yet', async () => {
    await setup();
    const chart = await screen.findByRole('list', { name: 'Calories by day' });
    expect(
      await within(chart).findByRole('link', { name: 'Mon, Sep 28: 1,800 kcal of 2,000 goal' }),
    ).toHaveAttribute('href', '/?date=2026-09-28');
    expect(
      within(chart).getByRole('link', { name: 'Tue, Sep 29: nothing logged of 2,000 goal' }),
    ).toBeInTheDocument();
    expect(
      within(chart).getByRole('link', { name: 'Wed, Sep 30: 2,200 kcal of 2,000 goal' }),
    ).toHaveAttribute('href', '/');
    expect(
      within(chart).getByLabelText('Thu, Oct 1: nothing logged of 2,000 goal, not yet'),
    ).toBeInTheDocument();
    expect(within(chart).queryByRole('link', { name: /Thu, Oct 1/ })).not.toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(document.title).toBe('History · Nouri');
  });

  it('summarizes logged days and lists each day', async () => {
    await setup();
    expect(await screen.findByText('2 of 7')).toBeInTheDocument();
    expect(screen.getByText('2,000 kcal')).toBeInTheDocument(); // (1800 + 2200) / 2
    const days = within(screen.getByRole('list', { name: 'Days' })).getAllByRole('listitem');
    expect(days[0]).toHaveTextContent('Monday, Sep 281,800 kcal / 2,000 goal');
    expect(days[1]).toHaveTextContent('Tuesday, Sep 29Nothing logged / 2,000 goal');
    expect(days[3]).toHaveTextContent('Thursday, Oct 1Not yet');
  });

  it('moves between weeks but not into the future', async () => {
    const { router } = await setup();
    await screen.findByText('2 of 7');
    expect(screen.getByRole('button', { name: 'Next week', hidden: true })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    expect(router.state.location.search).toBe('?week=2026-09-21');
    expect(await screen.findByText('1 of 7')).toBeInTheDocument();
    expect(screen.getByText('Sep 21 – Sep 27')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(router.state.location.search).toBe('');
  });

  it('invites logging in an empty week', async () => {
    await setup('/history?week=2026-08-31');
    expect(await screen.findByText(/Nothing logged this week/)).toBeInTheDocument();
  });

  it('includes exercise in a day’s goal when turned on', async () => {
    const { repos } = createTestRepositories();
    await repos.goals.setFrom('2026-09-01' as LocalDate, {
      kcal: 2000,
      p: 1,
      c: 1,
      f: 1,
      macroMode: 'grams',
    });
    await repos.profile.update({ exerciseCaloriesEnabled: true });
    await repos.exercise.set('2026-09-29' as LocalDate, 300);
    const router = createMemoryRouter(
      [{ path: '/history', element: <HistoryContainer repos={repos} now={NOW} /> }],
      {
        initialEntries: ['/history'],
      },
    );
    render(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('link', { name: 'Tue, Sep 29: nothing logged of 2,300 goal' }),
    ).toBeInTheDocument();
  });
});
