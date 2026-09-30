import { render, screen } from '@testing-library/react';
import { Utensils } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Button } from '../Button/Button';

describe('EmptyState', () => {
  it('names the space, says what to do and offers the action', () => {
    render(
      <EmptyState
        icon={Utensils}
        title="Nothing logged for lunch"
        action={<Button>Add food</Button>}
      >
        Tap Add food to log your first meal.
      </EmptyState>,
    );
    expect(screen.getByRole('heading', { name: 'Nothing logged for lunch' })).toBeInTheDocument();
    expect(screen.getByText('Tap Add food to log your first meal.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add food' })).toBeInTheDocument();
  });
});
