import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMPTY_CUSTOM_FOOD, type CustomFoodInput } from '@/domain';
import { CustomFoodForm, type CustomFoodFormProps } from './CustomFoodForm';

function renderForm(
  props: Partial<Omit<CustomFoodFormProps, 'value'>> & { value?: Partial<CustomFoodInput> } = {},
) {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  const utils = render(
    <CustomFoodForm
      errors={{}}
      submitLabel="Save food"
      onChange={onChange}
      onSubmit={onSubmit}
      {...props}
      value={{ ...EMPTY_CUSTOM_FOOD, ...props.value }}
    />,
  );
  return { onChange, onSubmit, ...utils };
}

describe('CustomFoodForm', () => {
  it('labels every field and uses the numeric keypad for numbers', () => {
    renderForm();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Also called (optional)')).toBeInTheDocument();
    for (const label of ['Calories (optional)', 'Protein', 'Carbs', 'Fat', 'Fiber (optional)']) {
      expect(screen.getByLabelText(label)).toHaveAttribute('inputmode', 'decimal');
    }
    expect(screen.getByRole('group', { name: 'Nutrition per 100 g' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Serving weight (optional)')).not.toBeInTheDocument();
  });

  it('asks for a serving weight (optional) only for per-serving foods', () => {
    renderForm({ value: { basis: 'serving' } });
    expect(screen.getByLabelText('Serving weight (optional)')).toHaveAccessibleDescription(
      /Leave empty if you don’t know it/,
    );
    expect(screen.getByRole('group', { name: 'Nutrition per serving' })).toBeInTheDocument();
  });

  it('reports edits by field', async () => {
    const { onChange } = renderForm();
    await userEvent.type(screen.getByLabelText('Protein'), '9');
    expect(onChange).toHaveBeenLastCalledWith('p', '9');
    await userEvent.click(screen.getByRole('radio', { name: 'Per serving' }));
    expect(onChange).toHaveBeenLastCalledWith('basis', 'serving');
  });

  it('submits with Enter or the button', async () => {
    const { onSubmit } = renderForm();
    await userEvent.type(screen.getByLabelText('Name'), 'x{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Save food' }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('moves focus to the first field with an error', () => {
    renderForm({ errors: { c: 'Enter carbs in grams.', f: 'Enter fat in grams.' } });
    expect(screen.getByLabelText('Carbs')).toHaveFocus();
    expect(screen.getByLabelText('Carbs')).toHaveAccessibleDescription('Enter carbs in grams.');
  });

  it('shows saving and save errors', () => {
    renderForm({ saving: true, saveError: 'Couldn’t save this food.' });
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t save this food.');
  });
});
