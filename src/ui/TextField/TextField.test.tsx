import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { TextField } from './TextField';

function Controlled(props: { error?: string; hint?: string }) {
  const [value, setValue] = useState('');
  return <TextField label="Name" value={value} onChange={setValue} {...props} />;
}

describe('TextField', () => {
  it('is labeled and editable', async () => {
    render(<Controlled />);
    await userEvent.type(screen.getByLabelText('Name'), 'Turon');
    expect(screen.getByLabelText('Name')).toHaveValue('Turon');
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-describedby');
  });

  it('links hint and error', () => {
    render(<Controlled hint="As on the label" error="Add a name." />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('As on the label Add a name.');
  });
});
