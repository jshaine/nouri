import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories } from '@/data/testing';
import type { Food } from '@/domain';
import { CustomFoodContainer } from './CustomFoodContainer';

const rice: Food = {
  key: 'usda:168878',
  source: 'usda',
  name: 'Rice, white, long-grain, regular, enriched, cooked',
  aliases: ['kanin'],
  basis: { kind: '100g' },
  nutrients: { kcal: 130, p: 2.7, c: 28.2, f: 0.3, fiber: 0.4 },
  portions: [{ label: '1 cup', grams: 158 }],
};

function setup() {
  const { repos } = createTestRepositories(undefined, [rice]);
  const onSaved = vi.fn();
  render(<CustomFoodContainer repo={repos.customFoods} reference={repos} onSaved={onSaved} />);
  return { repos, onSaved };
}

async function pickRice() {
  await userEvent.type(
    screen.getByRole('searchbox', { name: 'Start from a similar food (optional)' }),
    'kanin',
  );
  const list = await screen.findByRole('list', { name: 'Similar foods' });
  await userEvent.click(within(list).getByRole('button', { name: /Rice, white/ }));
}

describe('Manual: start from a similar food', () => {
  it('copies the facts per 100 g and says what they are based on', async () => {
    setup();
    await pickRice();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Based on Rice, white, long-grain, regular, enriched, cooked (USDA), per 100 g. Change anything you need.',
    );
    expect(screen.getByRole('radio', { name: 'Per 100 g' })).toBeChecked();
    expect(screen.getByLabelText('Calories (optional)')).toHaveValue('130');
    expect(screen.getByLabelText('Protein')).toHaveValue('2.7');
    expect(screen.getByLabelText('Carbs')).toHaveValue('28.2');
    expect(screen.getByLabelText('Fat')).toHaveValue('0.3');
    expect(screen.getByLabelText('Fiber (optional)')).toHaveValue('0.4');
    expect(screen.getByLabelText('Name')).toHaveValue(
      'Rice, white, long-grain, regular, enriched, cooked',
    );
  });

  it('keeps a name you already typed, and saves as your own food', async () => {
    const { repos, onSaved } = setup();
    await userEvent.type(screen.getByLabelText('Name'), 'Kanin ni Lola');
    await pickRice();
    expect(screen.getByLabelText('Name')).toHaveValue('Kanin ni Lola');
    await userEvent.clear(screen.getByLabelText('Carbs'));
    await userEvent.type(screen.getByLabelText('Carbs'), '30');
    await userEvent.click(screen.getByRole('button', { name: 'Save food' }));
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
    const saved = await repos.customFoods.get('id-1');
    expect(saved).toMatchObject({
      source: 'custom',
      name: 'Kanin ni Lola',
      nutrients: { kcal: 130, p: 2.7, c: 30, f: 0.3 },
    });
  });

  it('clears the copied facts but keeps the name', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Name'), 'My rice');
    await pickRice();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText('Protein')).toHaveValue('');
    expect(screen.getByLabelText('Name')).toHaveValue('My rice');
    expect(
      screen.getByRole('searchbox', { name: 'Start from a similar food (optional)' }),
    ).toBeInTheDocument();
  });

  it('says when nothing similar is found', async () => {
    setup();
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Start from a similar food (optional)' }),
      'dinuguan',
    );
    expect(await screen.findByText(/No similar food found/)).toBeInTheDocument();
  });

  it('is not shown when editing a food', () => {
    const { repos } = createTestRepositories(undefined, [rice]);
    render(
      <CustomFoodContainer
        repo={repos.customFoods}
        reference={repos}
        editing={{
          id: 'x',
          input: {
            name: 'Turon',
            aliases: '',
            basis: '100g',
            servingGrams: '',
            servingUnit: 'g',
            kcal: '',
            p: '1',
            c: '1',
            f: '1',
            fiber: '',
          },
        }}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});
