import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CustomFoodRepository } from '@/data';
import { createTestRepositories } from '@/data/testing';
import { foodToCustomFoodInput, type Food } from '@/domain';
import { CustomFoodContainer } from './CustomFoodContainer';

async function fill(fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    await userEvent.clear(screen.getByLabelText(label));
    await userEvent.type(screen.getByLabelText(label), value);
  }
}

describe('CustomFoodContainer', () => {
  it('saves a per-serving food without a weight and hands it back', async () => {
    const { repos } = createTestRepositories();
    const onSaved = vi.fn<(food: Food) => void>();
    render(<CustomFoodContainer repo={repos.customFoods} onSaved={onSaved} />);
    await fill({ Name: 'Tita’s adobo' });
    await userEvent.click(screen.getByRole('radio', { name: 'Per serving' }));
    await fill({ Protein: '28', Carbs: '4', Fat: '18' });
    await userEvent.click(screen.getByRole('button', { name: 'Save food' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
    const food = onSaved.mock.calls[0]?.[0];
    expect(food).toMatchObject({
      name: 'Tita’s adobo',
      basis: { kind: 'serving' },
      portions: [{ label: '1 serving', servings: 1 }],
    });
    expect(await repos.customFoods.get('id-1')).toEqual(food);
  });

  it('shows what to fix, keeps the input, and clears an error once edited', async () => {
    const { repos } = createTestRepositories();
    const onSaved = vi.fn();
    render(<CustomFoodContainer repo={repos.customFoods} onSaved={onSaved} />);
    await fill({ Protein: '20' });
    await userEvent.click(screen.getByRole('button', { name: 'Save food' }));

    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(/Add a name/);
    expect(screen.getByLabelText('Carbs')).toHaveAccessibleDescription(/Use 0 if there is none/);
    expect(screen.getByLabelText('Protein')).toHaveValue('20');
    expect(onSaved).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Name'), 'T');
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Carbs')).toHaveAttribute('aria-invalid', 'true');
  });

  it('explains a storage failure and keeps everything typed', async () => {
    const failing: Pick<CustomFoodRepository, 'create' | 'update'> = {
      create: () => Promise.reject(new Error('QuotaExceededError')),
      update: () => Promise.reject(new Error('nope')),
    };
    render(<CustomFoodContainer repo={failing} onSaved={vi.fn()} />);
    await fill({ Name: 'Turon', Protein: '2', Carbs: '40', Fat: '8' });
    await userEvent.click(screen.getByRole('button', { name: 'Save food' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/allows this site to store data/);
    expect(screen.getByLabelText('Name')).toHaveValue('Turon');
    expect(screen.getByRole('button', { name: 'Save food' })).toBeEnabled();
  });

  it('edits an existing food', async () => {
    const { repos } = createTestRepositories();
    const food = await repos.customFoods.create({
      name: 'Turon',
      aliases: [],
      basis: { kind: '100g' },
      p: 2,
      c: 40,
      f: 8,
    });
    const onSaved = vi.fn();
    render(
      <CustomFoodContainer
        repo={repos.customFoods}
        editing={{ id: 'id-1', input: foodToCustomFoodInput(food) }}
        onSaved={onSaved}
      />,
    );
    expect(screen.getByLabelText('Name')).toHaveValue('Turon');
    await fill({ Fat: '10' });
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
    expect((await repos.customFoods.get('id-1'))?.nutrients.f).toBe(10);
  });
});
