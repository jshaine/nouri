import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
] as const;

function Controlled({ hideLabel }: { hideLabel?: boolean }) {
  const [meal, setMeal] = useState<(typeof OPTIONS)[number]['value']>('lunch');
  return (
    <SegmentedControl
      label="Meal"
      options={OPTIONS}
      value={meal}
      onChange={setMeal}
      hideLabel={hideLabel}
    />
  );
}

describe('SegmentedControl', () => {
  it('is a labeled radio group with the current value checked', () => {
    render(<Controlled />);
    expect(screen.getByRole('group', { name: 'Meal' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Lunch' })).toBeChecked();
  });

  it('changes on click and with arrow keys', async () => {
    render(<Controlled />);
    await userEvent.click(screen.getByRole('radio', { name: 'Breakfast' }));
    expect(screen.getByRole('radio', { name: 'Breakfast' })).toBeChecked();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Lunch' })).toBeChecked();
  });

  it('can start with nothing chosen', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl label="Sex" options={OPTIONS} value={undefined} onChange={onChange} />,
    );
    expect(screen.getAllByRole('radio').some((r) => (r as HTMLInputElement).checked)).toBe(false);
    await userEvent.click(screen.getByRole('radio', { name: 'Breakfast' }));
    expect(onChange).toHaveBeenCalledWith('breakfast');
  });

  it('can hide the legend visually but keep it for screen readers', () => {
    render(<Controlled hideLabel />);
    expect(screen.getByText('Meal')).toHaveClass('visually-hidden');
    expect(screen.getByRole('group', { name: 'Meal' })).toBeInTheDocument();
  });

  it('describes the group with its error', () => {
    render(
      <SegmentedControl
        label="Meal"
        options={OPTIONS}
        value={undefined}
        error="Choose a meal."
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('group', { name: 'Meal' })).toHaveAccessibleDescription(
      'Choose a meal.',
    );
  });
});
