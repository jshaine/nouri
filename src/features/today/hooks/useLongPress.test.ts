import { act, renderHook } from '@testing-library/react';
import type { PointerEvent } from 'react';
import { LONG_PRESS_MS, useLongPress } from './useLongPress';

const at = (x: number, y: number) => ({ clientX: x, clientY: y }) as PointerEvent;

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const onLong = vi.fn();
    const onTap = vi.fn();
    const { result } = renderHook(() => useLongPress(onLong, onTap));
    return { onLong, onTap, h: () => result.current };
  }

  it('taps normally', () => {
    const { onLong, onTap, h } = setup();
    h().onPointerDown(at(0, 0));
    h().onPointerUp();
    h().onClick();
    expect(onTap).toHaveBeenCalledOnce();
    expect(onLong).not.toHaveBeenCalled();
  });

  it('fires after holding and swallows the following click', () => {
    const { onLong, onTap, h } = setup();
    h().onPointerDown(at(0, 0));
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS);
    });
    expect(onLong).toHaveBeenCalledOnce();
    h().onClick();
    expect(onTap).not.toHaveBeenCalled();
    h().onClick();
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('cancels when the finger moves (scrolling)', () => {
    const { onLong, h } = setup();
    h().onPointerDown(at(0, 0));
    h().onPointerMove(at(0, 4));
    h().onPointerMove(at(0, 30));
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS * 2);
    });
    expect(onLong).not.toHaveBeenCalled();
  });

  it('blocks the long-press context menu', () => {
    const { h } = setup();
    const e = { preventDefault: vi.fn() };
    h().onContextMenu(e);
    expect(e.preventDefault).toHaveBeenCalled();
  });
});
