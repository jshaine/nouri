import { useRef, type PointerEvent } from 'react';

/** Hold time before a press counts as long. */
export const LONG_PRESS_MS = 550;
/** Finger travel that cancels (the user is scrolling). */
const MOVE_TOLERANCE_PX = 10;

/**
 * Long-press without breaking taps or scrolling: moving cancels it, and the
 * click that follows a long press is swallowed. Also blocks the context menu
 * that Android shows on long-press.
 */
export function useLongPress(onLongPress: () => void, onTap: () => void) {
  const timer = useRef<number | undefined>(undefined);
  const start = useRef<{ x: number; y: number } | undefined>(undefined);
  const fired = useRef(false);

  const cancel = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    start.current = undefined;
  };

  return {
    onPointerDown: (e: PointerEvent) => {
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        fired.current = true;
        cancel();
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e: PointerEvent) => {
      const s = start.current;
      if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu: (e: { preventDefault(): void }) => {
      e.preventDefault();
    },
    onClick: () => {
      if (fired.current) {
        fired.current = false;
        return;
      }
      onTap();
    },
  };
}
