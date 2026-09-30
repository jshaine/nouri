import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories, firstValue } from '@/data/testing';
import type { Food, LocalDate } from '@/domain';
import { FoodDetailContainer } from './FoodDetailContainer';

const TODAY = '2026-09-30' as LocalDate;
const rice: Food = {
  key: 'usda:168878',
  source: 'usda',
  name: 'Rice, white, cooked',
  aliases: [],
  basis: { kind: '100g' },
  nutrients: { kcal: 130, p: 2.7, c: 28, f: 0.3 },
  portions: [{ label: '1 cup', grams: 158 }],
};
const adobo: Food = {
  ...rice,
  key: 'custom:a',
  source: 'custom',
  name: 'Adobo',
  basis: { kind: 'serving' },
  nutrients: { p: 28, c: 4, f: 18 },
  portions: [{ label: '1 serving', servings: 1 }],
};

function setup(food: Food, repos = createTestRepositories().repos) {
  render(
    <FoodDetailContainer
      food={food}
      date={TODAY}
      initialMeal="lunch"
      repo={repos.entries}
      portions={repos.portionOverrides}
      onAdded={vi.fn()}
    />,
  );
  return repos;
}

describe('Save portion', () => {
  it('prefills the current amount, saves it and selects it', async () => {
    const repos = setup(rice);
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save portion' }));
    expect(screen.getByLabelText('Weight')).toHaveValue('237'); // 1.5 × 158 g
    await userEvent.clear(screen.getByLabelText('Weight'));
    await userEvent.type(screen.getByLabelText('Weight'), '160');
    await userEvent.type(screen.getByLabelText('Portion name'), '1 cup kanin');
    await userEvent.click(screen.getByRole('button', { name: 'Save portion' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Portion')).toHaveDisplayValue('1 cup kanin (160 g)');
    });
    expect(screen.getByLabelText('Quantity')).toHaveValue('1');
    expect(screen.getByRole('region', { name: 'This amount' })).toHaveTextContent('208 kcal');
    expect(screen.queryByRole('group', { name: 'Save a portion' })).not.toBeInTheDocument();
    expect(await firstValue(repos.portionOverrides.live(rice.key))).toEqual([
      { label: '1 cup kanin', grams: 160 },
    ]);
  });

  it('explains missing details and can be cancelled', async () => {
    setup(rice);
    await userEvent.click(screen.getByRole('button', { name: 'Save portion' }));
    await userEvent.clear(screen.getByLabelText('Weight'));
    await userEvent.click(screen.getByRole('button', { name: 'Save portion' }));
    expect(screen.getByLabelText('Portion name')).toHaveAccessibleDescription(/Name the portion/);
    expect(screen.getByLabelText('Weight')).toHaveAccessibleDescription(/how many grams/);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Portion name')).not.toBeInTheDocument();
  });

  it('uses servings for a food of unknown weight', async () => {
    const repos = setup(adobo);
    await userEvent.click(screen.getByRole('button', { name: 'Save portion' }));
    expect(screen.getByLabelText('Servings')).toHaveValue('1');
    await userEvent.clear(screen.getByLabelText('Servings'));
    await userEvent.type(screen.getByLabelText('Servings'), '0.5');
    await userEvent.type(screen.getByLabelText('Portion name'), 'half plate');
    await userEvent.click(screen.getByRole('button', { name: 'Save portion' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Portion')).toHaveDisplayValue('half plate');
    });
    expect(screen.getByRole('region', { name: 'This amount' })).toHaveTextContent('145 kcal');
    expect(await firstValue(repos.portionOverrides.live(adobo.key))).toEqual([
      { label: 'half plate', servings: 0.5 },
    ]);
  });

  it('offers saved portions the next time the food opens', async () => {
    const { repos } = createTestRepositories();
    await repos.portionOverrides.save(rice.key, { label: '1 cup kanin', grams: 160 });
    setup(rice, repos);
    expect(await screen.findByRole('option', { name: '1 cup kanin (160 g)' })).toBeInTheDocument();
  });

  it('hides Save portion without a portions repository', () => {
    const { repos } = createTestRepositories();
    render(<FoodDetailContainer food={rice} date={TODAY} repo={repos.entries} onAdded={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Save portion' })).not.toBeInTheDocument();
  });
});
