import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoiceCards } from './ChoiceCards';

const OPTIONS = [
  { value: 'lose', label: 'Lose weight', description: 'Eat a little less' },
  { value: 'maintain', label: 'Maintain' },
] as const;

describe('ChoiceCards', () => {
  it('is a labeled radio group whose cards name their option and description', async () => {
    const onChange = vi.fn();
    render(<ChoiceCards label="Goal" options={OPTIONS} value={undefined} onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Goal' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').some((r) => (r as HTMLInputElement).checked)).toBe(false);
    await userEvent.click(screen.getByRole('radio', { name: /Lose weight Eat a little less/ }));
    expect(onChange).toHaveBeenCalledWith('lose');
  });

  it('describes the group with its hint and error', () => {
    render(
      <ChoiceCards
        label="Goal"
        hint="Pick one."
        error="Choose a goal."
        options={OPTIONS}
        value="maintain"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('group', { name: 'Goal' })).toHaveAccessibleDescription(
      'Pick one. Choose a goal.',
    );
    expect(screen.getByRole('radio', { name: 'Maintain' })).toBeChecked();
  });
});
