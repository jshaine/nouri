import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories } from '@/data/testing';
import { goalForDate, type LocalDate } from '@/domain';
import { GoalsContainer } from './GoalsContainer';

const NOW = () => new Date(2026, 8, 30, 9);
const TODAY = '2026-09-30' as LocalDate;

function setup() {
  const { repos } = createTestRepositories();
  render(<GoalsContainer repo={repos.goals} now={NOW} />);
  return { repos };
}

describe('GoalsContainer', () => {
  it('sets a first goal by percent, previewing grams', async () => {
    const { repos } = setup();
    const kcal = await screen.findByLabelText('Daily calories');
    expect(kcal).toHaveAttribute('inputmode', 'numeric');
    await userEvent.type(kcal, '2000');
    expect(screen.getByLabelText('Macro split')).toHaveDisplayValue(/Default/);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('100 g'),
      expect.stringContaining('250 g'),
      expect.stringContaining('67 g'),
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Save goals' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Goals saved. They apply from today.',
    );
    const [goal] = await repos.goals.all();
    expect(goal).toMatchObject({
      effectiveFrom: TODAY,
      kcal: 2000,
      p: 100,
      c: 250,
      f: 67,
      macroMode: 'percent',
    });
  });

  it('switches presets and blocks splits that do not total 100%', async () => {
    setup();
    await userEvent.type(await screen.findByLabelText('Daily calories'), '1800');
    await userEvent.selectOptions(screen.getByLabelText('Macro split'), 'high-protein');
    expect(screen.getByLabelText('protein percent')).toHaveValue('30');
    await userEvent.click(screen.getByRole('button', { name: 'Increase fat percent' }));
    expect(screen.getByLabelText('Macro split')).toHaveDisplayValue('Custom');
    expect(screen.getByText('Total 105% (needs 100%)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save goals' }));
    expect(screen.getByRole('alert')).toHaveTextContent('add up to 105%');
    await userEvent.click(screen.getByRole('button', { name: 'Decrease carbs percent' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Total 100%')).toBeInTheDocument();
  });

  it('sets gram targets, deriving calories', async () => {
    const { repos } = setup();
    await userEvent.click(await screen.findByRole('radio', { name: 'Grams' }));
    await userEvent.type(screen.getByLabelText('Protein'), '120');
    await userEvent.type(screen.getByLabelText('Carbs'), '200');
    expect(screen.getByText('Calories: enter all three targets')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Fat'), '60');
    expect(screen.getByText('= 1,820 kcal a day')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save goals' }));
    await screen.findByRole('status');
    expect((await repos.goals.all())[0]).toMatchObject({ kcal: 1820, macroMode: 'grams' });
  });

  it('explains missing calories', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Save goals' }));
    expect(screen.getByLabelText('Daily calories')).toHaveAccessibleDescription(
      /Enter a daily calorie goal/,
    );
  });

  it('loads the current goal, and a change keeps past days on the old one', async () => {
    const { repos } = createTestRepositories();
    await repos.goals.setFrom('2026-09-01' as LocalDate, {
      kcal: 1850,
      p: 139,
      c: 185,
      f: 62,
      macroMode: 'percent',
      percents: { c: 40, p: 30, f: 30 },
    });
    render(<GoalsContainer repo={repos.goals} now={NOW} />);
    const kcal = await screen.findByLabelText('Daily calories');
    expect(kcal).toHaveValue('1850');
    expect(screen.getByLabelText('Macro split')).toHaveDisplayValue(/High protein/);
    await userEvent.clear(kcal);
    await userEvent.type(kcal, '1700');
    await userEvent.click(screen.getByRole('button', { name: 'Save goals' }));
    await waitFor(async () => {
      expect(await repos.goals.all()).toHaveLength(2);
    });
    const all = await repos.goals.all();
    expect(goalForDate(all, '2026-09-15' as LocalDate)?.kcal).toBe(1850);
    expect(goalForDate(all, TODAY)?.kcal).toBe(1700);
    expect(screen.getByLabelText('Daily calories')).toHaveValue('1700');
  });

  it('reports a failed save', async () => {
    render(
      <GoalsContainer
        now={NOW}
        repo={{
          live: () => ({
            subscribe: (next) => {
              next([]);
              return { unsubscribe: () => undefined };
            },
          }),
          setFrom: () => Promise.reject(new Error('blocked')),
        }}
      />,
    );
    await userEvent.type(await screen.findByLabelText('Daily calories'), '2000');
    await userEvent.click(screen.getByRole('button', { name: 'Save goals' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/allows this site to store data/);
  });
});
