import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectField } from './SelectField';

describe('SelectField', () => {
  it('is labeled and reports the chosen value', async () => {
    const onChange = vi.fn();
    render(
      <SelectField
        label="Portion"
        hint="Or pick grams"
        value="a"
        onChange={onChange}
        options={[
          { value: 'a', label: '1 cup' },
          { value: 'g', label: 'grams' },
        ]}
      />,
    );
    const select = screen.getByLabelText('Portion');
    expect(select).toHaveAccessibleDescription('Or pick grams');
    await userEvent.selectOptions(select, 'grams');
    expect(onChange).toHaveBeenCalledWith('g');
  });
});
