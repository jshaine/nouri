import { act, renderHook } from '@testing-library/react';
import { useLive, type Subscribable } from './useLive';

function source<T>() {
  const listeners = new Set<{ next: (v: T) => void; error?: (e: unknown) => void }>();
  const s: Subscribable<T> & { emit(v: T): void; fail(e: unknown): void; count(): number } = {
    subscribe(next, error) {
      const l = { next, error };
      listeners.add(l);
      return {
        unsubscribe() {
          listeners.delete(l);
        },
      };
    },
    emit: (v) => {
      listeners.forEach((l) => {
        l.next(v);
      });
    },
    fail: (e) => {
      listeners.forEach((l) => l.error?.(e));
    },
    count: () => listeners.size,
  };
  return s;
}

describe('useLive', () => {
  it('goes from loading to each emitted value', () => {
    const s = source<number>();
    const { result } = renderHook(() => useLive(() => s, [s]));
    expect(result.current).toEqual({ status: 'loading', value: undefined });
    act(() => {
      s.emit(1);
    });
    expect(result.current).toEqual({ status: 'ready', value: 1 });
    act(() => {
      s.emit(2);
    });
    expect(result.current.value).toBe(2);
  });

  it('keeps the previous value while a new source loads, then unsubscribes the old one', () => {
    const a = source<string>();
    const b = source<string>();
    const { result, rerender } = renderHook(({ s }) => useLive(() => s, [s]), {
      initialProps: { s: a },
    });
    act(() => {
      a.emit('monday');
    });
    rerender({ s: b });
    expect(result.current).toEqual({ status: 'loading', value: 'monday' });
    expect(a.count()).toBe(0);
    act(() => {
      b.emit('tuesday');
    });
    expect(result.current).toEqual({ status: 'ready', value: 'tuesday' });
  });

  it('reports errors with the last good value', () => {
    const s = source<number>();
    const { result } = renderHook(() => useLive(() => s, [s]));
    act(() => {
      s.emit(5);
      s.fail(new Error('blocked'));
    });
    expect(result.current).toMatchObject({ status: 'error', value: 5 });
  });

  it('unsubscribes on unmount', () => {
    const s = source<number>();
    const { unmount } = renderHook(() => useLive(() => s, [s]));
    expect(s.count()).toBe(1);
    unmount();
    expect(s.count()).toBe(0);
  });
});
