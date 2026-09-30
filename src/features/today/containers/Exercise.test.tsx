import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createTestRepositories, firstValue } from '@/data/testing';
import type { LocalDate } from '@/domain';
import { SettingsContainer } from '@/features/settings';
import { TodayContainer } from './TodayContainer';

const NOW = () => new Date(2026, 8, 30, 12);
const TODAY = '2026-09-30' as LocalDate;

async function setup(enabled: boolean, path = '/') {
  const { repos } = createTestRepositories();
  await repos.goals.setFrom('2026-09-01' as LocalDate, {
    kcal: 2000,
    p: 100,
    c: 250,
    f: 67,
    macroMode: 'grams',
  });
  await repos.profile.update({ exerciseCaloriesEnabled: enabled });
  const router = createMemoryRouter(
    [{ path: '/', element: <TodayContainer repos={repos} now={NOW} /> }],
    {
      initialEntries: [path],
    },
  );
  render(<RouterProvider router={router} />);
  return { repos };
}

describe('exercise calories', () => {
  it('is off by default: no field, goal unchanged', async () => {
    await setup(false);
    expect(await screen.findByText('Goal 2,000')).toBeInTheDocument();
    expect(screen.queryByLabelText('Exercise')).not.toBeInTheDocument();
  });

  it('adds the day’s exercise to its goal, scaling the macros', async () => {
    const { repos } = await setup(true);
    const field = await screen.findByLabelText('Exercise');
    await userEvent.type(field, '300');
    await userEvent.tab();
    expect(await screen.findByText('Goal 2,300 (incl. 300 exercise)')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Daily Facts' })).toHaveTextContent(
      'Protein 0 g / 115 g',
    );
    expect(await firstValue(repos.exercise.liveForDate(TODAY))).toBe(300);
  });

  it('explains an invalid amount and keeps the goal', async () => {
    await setup(true);
    await userEvent.type(await screen.findByLabelText('Exercise'), '99999');
    await userEvent.tab();
    expect(screen.getByLabelText('Exercise')).toHaveAccessibleDescription(/from 0 to 5000/);
    expect(screen.getByText('Goal 2,000')).toBeInTheDocument();
  });

  it('keeps each day’s exercise separate', async () => {
    const { repos } = await setup(true, '/?date=2026-09-29');
    await repos.exercise.set(TODAY, 400);
    expect(await screen.findByText('Goal 2,000')).toBeInTheDocument();
    expect(screen.getByLabelText('Exercise')).toHaveValue('');
  });
});

describe('exercise setting', () => {
  it('turns on from Settings', async () => {
    const { repos } = createTestRepositories();
    render(<SettingsContainer repos={repos} version="1" />);
    await userEvent.click(await screen.findByRole('radio', { name: 'On' }));
    await waitFor(async () => {
      expect((await repos.profile.get()).exerciseCaloriesEnabled).toBe(true);
    });
    expect(screen.getByRole('radio', { name: 'On' })).toBeChecked();
  });
});
