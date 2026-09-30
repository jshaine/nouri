import { act, fireEvent, render, screen } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces politely and dismisses itself after the duration', () => {
    const onDismiss = vi.fn();
    render(<Toast message="Entry deleted" onDismiss={onDismiss} durationMs={1000} />);
    expect(screen.getByRole('status')).toHaveTextContent('Entry deleted');
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('runs the action and dismisses', () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    render(
      <Toast
        message="Entry deleted"
        actionLabel="Undo"
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('pauses while its action has focus', () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        message="Entry deleted"
        actionLabel="Undo"
        onAction={vi.fn()}
        onDismiss={onDismiss}
        durationMs={1000}
      />,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Undo' }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.blur(screen.getByRole('button', { name: 'Undo' }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('pauses while hovered', () => {
    const onDismiss = vi.fn();
    render(<Toast message="Saved" onDismiss={onDismiss} durationMs={1000} />);
    fireEvent.pointerEnter(screen.getByRole('status'));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.pointerLeave(screen.getByRole('status'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
