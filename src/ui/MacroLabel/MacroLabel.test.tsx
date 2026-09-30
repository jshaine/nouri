import { render, screen } from '@testing-library/react';
import { MacroLabel } from './MacroLabel';

describe('MacroLabel', () => {
  it('shows the full name with its letter emphasized', () => {
    const { container } = render(<MacroLabel macro="protein" />);
    expect(container).toHaveTextContent('Protein');
    expect(container.querySelector('b')).toHaveTextContent('P');
  });

  it('keeps the full name for screen readers in letter mode', () => {
    render(<MacroLabel macro="carbs" variant="letter" />);
    expect(screen.getByText('Carbs')).toHaveClass('visually-hidden');
    expect(screen.getByText('C')).toHaveAttribute('aria-hidden', 'true');
  });
});
