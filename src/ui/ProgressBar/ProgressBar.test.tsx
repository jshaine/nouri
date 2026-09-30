import { render } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

const bar = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('ProgressBar', () => {
  it('is hidden from assistive tech (numbers live in adjacent text)', () => {
    const { container } = render(<ProgressBar value={50} goal={100} macro="protein" />);
    expect(bar(container)).toHaveAttribute('aria-hidden', 'true');
    expect(bar(container)).toHaveAttribute('data-macro', 'protein');
  });

  it('fills proportionally without an overflow segment under the goal', () => {
    const { container } = render(<ProgressBar value={50} goal={100} />);
    expect(bar(container).style.getPropertyValue('--fill')).toBe('0.5');
    expect(bar(container)).not.toHaveAttribute('data-over');
    expect(bar(container).children).toHaveLength(1);
  });

  it('adds a striped overflow segment past the goal', () => {
    const { container } = render(<ProgressBar value={200} goal={100} macro="fat" />);
    expect(bar(container)).toHaveAttribute('data-over', 'true');
    expect(bar(container).children).toHaveLength(2);
    expect(bar(container).style.getPropertyValue('--overflow')).toBe('0.5');
  });

  it('uses ink for calories', () => {
    const { container } = render(<ProgressBar value={1} goal={2} />);
    expect(bar(container)).toHaveAttribute('data-macro', 'calories');
  });
});
