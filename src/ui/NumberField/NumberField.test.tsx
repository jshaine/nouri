import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { NumberField } from './NumberField';

function Controlled(props: { error?: string; hint?: string }) {
  const [value, setValue] = useState('');
  return <NumberField label="Protein" unit="g" value={value} onChange={setValue} {...props} />;
}

describe('NumberField', () => {
  it('is labeled and opens the decimal keypad', () => {
    render(<Controlled />);
    const input = screen.getByLabelText('Protein');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('keeps partial input while typing', async () => {
    render(<Controlled />);
    await userEvent.type(screen.getByLabelText('Protein'), '1.');
    expect(screen.getByLabelText('Protein')).toHaveValue('1.');
  });

  it('links hint and error text and marks the field invalid', () => {
    render(<Controlled hint="Per 100 g" error="Enter a number, like 12.5." />);
    const input = screen.getByLabelText('Protein');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Per 100 g Enter a number, like 12.5.');
  });

  it('has no description when there is nothing to say', () => {
    render(<Controlled />);
    expect(screen.getByLabelText('Protein')).not.toHaveAttribute('aria-describedby');
  });
});
