import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createTestRepositories, firstValue } from '@/data/testing';
import type { LocalDate, NewEntry } from '@/domain';
import { TodayContainer } from './TodayContainer';

const TODAY = '2026-09-30' as LocalDate;
const NOW = () => new Date(2026, 8, 30, 12);
const adobo: NewEntry = {
  date: TODAY,
  meal: 'lunch',
  foodKey: 'custom:a',
  amount: 1,
  unit: { kind: 'portion', label: '1 serving' },
  name: 'Adobo',
  source: 'custom',
  totals: { kcal: 290, p: 28, c: 4, f: 18 },
};

function setup() {
  const { repos } = createTestRepositories();
  const router = createMemoryRouter([
    { path: '/', element: <TodayContainer repos={repos} now={NOW} /> },
  ]);
  render(<RouterProvider router={router} />);
  return { repos };
}

async function type(label: string, value: string) {
  await userEvent.type(screen.getByLabelText(label), value);
}

describe('Today logging', () => {
  it('creates a food in Manual, logs it, and asks for persistent storage', async () => {
    const { repos } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Add food' }));
    const sheet = screen.getByRole('dialog', { name: 'Add food' });
    expect(
      await within(sheet).findByRole('heading', { name: 'No foods of your own yet' }),
    ).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Add a food' }));
    await type('Name', 'Turon');
    await userEvent.click(screen.getByRole('radio', { name: 'Per serving' }));
    await type('Protein', '2');
    await type('Carbs', '40');
    await type('Fat', '8');
    await userEvent.click(screen.getByRole('button', { name: 'Save food' }));

    const detail = await screen.findByRole('dialog', { name: 'Turon' });
    await userEvent.click(within(detail).getByRole('radio', { name: 'Snacks' }));
    await userEvent.click(within(detail).getByRole('button', { name: 'Add to log' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Added to Snacks');
    expect(
      within(screen.getByRole('region', { name: 'Snacks' })).getByText(/Turon/),
    ).toBeInTheDocument();
    await waitFor(async () => {
      expect((await repos.settings.get()).persistGranted).toBe(false); // jsdom has no storage manager
    });
  });

  it('logs a saved food from My foods', async () => {
    const { repos } = setup();
    await repos.customFoods.create({
      name: 'Pandesal',
      aliases: [],
      basis: { kind: 'serving' },
      p: 3,
      c: 22,
      f: 2,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Add food' }));
    await userEvent.click(await screen.findByRole('button', { name: /Pandesal/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to log' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Added to Lunch');
    expect((await firstValue(repos.entries.liveForDate(TODAY)))[0]?.name).toBe('Pandesal');
  });

  it('edits an entry amount and meal', async () => {
    const { repos } = setup();
    await repos.entries.add(adobo);
    await userEvent.click(await screen.findByRole('button', { name: /Adobo/ }));
    const editor = screen.getByRole('dialog', { name: 'Adobo' });
    await userEvent.click(within(editor).getByRole('button', { name: 'Increase amount' }));
    await userEvent.click(within(editor).getByRole('radio', { name: 'Dinner' }));
    expect(within(editor).getByText('435 kcal')).toBeInTheDocument();
    await userEvent.click(within(editor).getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(
        within(screen.getByRole('region', { name: 'Dinner' })).getByText('435 kcal'),
      ).toBeInTheDocument();
    });
  });

  it('deletes from the editor with an undo that restores the entry', async () => {
    const { repos } = setup();
    await repos.entries.add(adobo);
    await userEvent.click(await screen.findByRole('button', { name: /Adobo/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Removed Adobo');
    expect(
      await screen.findByRole('heading', { name: 'Nothing logged today' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByRole('button', { name: /Adobo/ })).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('Restored Adobo');
  });

  it('deletes on long-press', async () => {
    const { repos } = setup();
    await repos.entries.add(adobo);
    const row = await screen.findByRole('button', { name: /Adobo/ });
    expect(row).toHaveAccessibleDescription('Tap to edit. Press and hold to delete.');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fireEvent.pointerDown(row, { clientX: 5, clientY: 5 });
    await vi.advanceTimersByTimeAsync(600);
    vi.useRealTimers();
    expect(await screen.findByRole('status')).toHaveTextContent('Removed Adobo');
    expect(screen.queryByRole('dialog', { name: 'Adobo' })).not.toBeInTheDocument();
  });
});
