import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories, firstValue } from '@/data/testing';
import type { Entry, Food, LocalDate } from '@/domain';
import { FoodDetailContainer, basisNote } from './FoodDetailContainer';

const TODAY = '2026-09-30' as LocalDate;
const rice: Food = {
  key: 'usda:169756',
  source: 'usda',
  name: 'Rice, white, cooked',
  aliases: ['kanin'],
  basis: { kind: '100g' },
  nutrients: { kcal: 130, p: 2.7, c: 28, f: 0.3 },
  portions: [{ label: '1 cup', grams: 158 }],
};
const adobo: Food = {
  key: 'custom:a',
  source: 'custom',
  name: 'Adobo',
  aliases: [],
  basis: { kind: 'serving' },
  nutrients: { p: 28, c: 4, f: 18 },
  portions: [{ label: '1 serving', servings: 1 }],
};

function setup(food: Food, extra: Partial<Parameters<typeof FoodDetailContainer>[0]> = {}) {
  const { repos } = createTestRepositories();
  const onAdded = vi.fn<(e: Entry) => void>();
  render(
    <FoodDetailContainer
      food={food}
      date={TODAY}
      initialMeal="lunch"
      repo={repos.entries}
      onAdded={onAdded}
      {...extra}
    />,
  );
  return { repos, onAdded };
}

describe('FoodDetailContainer', () => {
  it('starts with one of the first portion and previews its macros', () => {
    setup(rice);
    expect(screen.getByLabelText('Portion')).toHaveDisplayValue('1 cup (158 g)');
    expect(screen.getByLabelText('Quantity')).toHaveValue('1');
    expect(screen.getByRole('region', { name: 'This amount' })).toHaveTextContent('205 kcal');
    expect(screen.getByTitle('USDA FoodData Central')).toHaveTextContent('Source: USDA');
    expect(screen.getByText('Nutrition per 100 g')).toBeInTheDocument();
  });

  it('switches to grams at 100 g and steps by 10', async () => {
    setup(rice);
    await userEvent.selectOptions(screen.getByLabelText('Portion'), 'grams');
    expect(screen.getByLabelText('Grams')).toHaveValue('100');
    await userEvent.click(screen.getByRole('button', { name: 'Increase grams' }));
    expect(screen.getByLabelText('Grams')).toHaveValue('110');
    expect(screen.getByRole('region', { name: 'This amount' })).toHaveTextContent('143 kcal');
  });

  it('offers no grams for a serving of unknown weight', () => {
    setup(adobo);
    expect(screen.getByLabelText('Portion')).toHaveDisplayValue('1 serving');
    expect(screen.queryByRole('option', { name: 'grams' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'This amount' })).toHaveTextContent('290 kcal');
  });

  it('logs a snapshot for the chosen meal and day', async () => {
    const { repos, onAdded } = setup(adobo);
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Dinner' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to log' }));
    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledOnce();
    });
    const [saved] = await firstValue(repos.entries.liveForDate(TODAY));
    expect(saved).toMatchObject({
      meal: 'dinner',
      foodKey: 'custom:a',
      amount: 1.5,
      unit: { kind: 'portion', label: '1 serving' },
      name: 'Adobo',
      source: 'custom',
      totals: { kcal: 435, p: 42, c: 6, f: 27 },
    });
  });

  it('defaults the meal by time of day', () => {
    const { repos } = createTestRepositories();
    render(<FoodDetailContainer food={rice} date={TODAY} repo={repos.entries} onAdded={vi.fn()} />);
    // The default comes from mealForTime(now); just check one meal is chosen.
    expect(
      screen.getAllByRole('radio').filter((r) => (r as HTMLInputElement).checked),
    ).toHaveLength(1);
  });

  it('blocks a zero amount and explains storage failures', async () => {
    const onAdded = vi.fn();
    render(
      <FoodDetailContainer
        food={adobo}
        date={TODAY}
        initialMeal="lunch"
        repo={{ add: () => Promise.reject(new Error('blocked')) }}
        onAdded={onAdded}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add to log' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/allows this site to store data/);
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(screen.getByRole('button', { name: 'Add to log' })).toBeDisabled();
    expect(onAdded).not.toHaveBeenCalled();
  });
});

describe('basisNote', () => {
  it('describes each basis', () => {
    expect(basisNote(rice)).toBe('Nutrition per 100 g');
    expect(basisNote(adobo)).toBe('Nutrition per serving');
    expect(basisNote({ ...adobo, basis: { kind: 'serving', servingGrams: 180 } })).toBe(
      'Nutrition per serving (180 g)',
    );
  });
});

describe('favorites', () => {
  it('toggles the star, exposed as a pressed button', async () => {
    const { repos } = createTestRepositories();
    render(
      <FoodDetailContainer
        food={rice}
        date={TODAY}
        initialMeal="lunch"
        repo={repos.entries}
        usage={repos.usage}
        onAdded={vi.fn()}
      />,
    );
    const star = await screen.findByRole('button', { name: 'Add to favorites' });
    expect(star).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(star);
    const pressed = await screen.findByRole('button', { name: 'Remove from favorites' });
    expect(pressed).toHaveAttribute('aria-pressed', 'true');
    expect(await firstValue(repos.usage.isFavorite(rice.key))).toBe(true);
  });

  it('hides the star without a usage repository', () => {
    setup(rice);
    expect(screen.queryByRole('button', { name: /favorites/ })).not.toBeInTheDocument();
  });
});
