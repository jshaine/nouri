import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Stepper } from './Stepper';

function Controlled({ initial = 1, ...rest }: { initial?: number; step?: number; max?: number }) {
  const [value, setValue] = useState(initial);
  return <Stepper label="Quantity" value={value} onChange={setValue} {...rest} />;
}

describe('Stepper', () => {
  it('steps up and down', async () => {
    render(<Controlled step={0.5} />);
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(screen.getByLabelText('Quantity')).toHaveValue('1.5');
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(screen.getByLabelText('Quantity')).toHaveValue('0.5');
  });

  it('disables decrease at the minimum and increase at the maximum', () => {
    render(<Controlled initial={0} max={0} />);
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('accepts typed values (comma decimals too) and clamps them', async () => {
    render(<Controlled max={10} />);
    const input = screen.getByLabelText('Quantity');
    await userEvent.clear(input);
    await userEvent.type(input, '2,5{Enter}');
    expect(input).toHaveValue('2.5');
    await userEvent.clear(input);
    await userEvent.type(input, '99');
    await userEvent.tab();
    expect(input).toHaveValue('10');
  });

  it('reverts text that is not a number', async () => {
    render(<Controlled initial={3} />);
    const input = screen.getByLabelText('Quantity');
    await userEvent.clear(input);
    await userEvent.type(input, 'abc');
    await userEvent.tab();
    expect(input).toHaveValue('3');
  });

  it('avoids floating point noise', async () => {
    render(<Controlled initial={0.1} step={0.2} />);
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(screen.getByLabelText('Quantity')).toHaveValue('0.3');
  });
});
