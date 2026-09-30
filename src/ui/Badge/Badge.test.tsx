import { render, screen } from '@testing-library/react';
import { SourceBadge } from './Badge';

describe('SourceBadge', () => {
  it.each([
    ['usda', 'USDA', 'USDA FoodData Central'],
    ['fnri', 'FNRI', 'FNRI Philippine Food Composition Tables'],
    ['custom', 'Custom', 'Your own entry'],
  ] as const)('labels %s foods', (source, label, description) => {
    render(<SourceBadge source={source} />);
    const badge = screen.getByText(label);
    expect(badge).toHaveAttribute('title', description);
    expect(badge).toHaveTextContent(`Source: ${label}`);
  });
});
