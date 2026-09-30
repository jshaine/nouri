import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus } from 'lucide-react';
import { Button } from './Button';
import { IconButton } from '../IconButton/IconButton';

describe('Button', () => {
  it('is a non-submitting button by default and fires onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button icon={Plus} onClick={onClick}>
        Add food
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Add food' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('IconButton', () => {
  it('uses its label as the accessible name', () => {
    render(<IconButton icon={Plus} label="Add food" />);
    expect(screen.getByRole('button', { name: 'Add food' })).toBeInTheDocument();
  });
});
