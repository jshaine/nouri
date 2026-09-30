import { useEffect, useRef, useState } from 'react';
import { TOAST_DURATION_MS } from '../constants';
import styles from './Toast.module.css';

export interface ToastProps {
  message: string;
  /** Optional action, e.g. "Undo". Taking it also dismisses the toast. */
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

/** Brief status message. The timer pauses while hovered or while its action has focus. */
export function Toast({
  message,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = TOAST_DURATION_MS,
}: ToastProps) {
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      dismissRef.current();
    }, durationMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [paused, durationMs]);

  // Hover pause is a pointer nicety on a status region, so it's wired natively.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pause = () => {
      setPaused(true);
    };
    const resume = () => {
      setPaused(false);
    };
    el.addEventListener('pointerenter', pause);
    el.addEventListener('pointerleave', resume);
    return () => {
      el.removeEventListener('pointerenter', pause);
      el.removeEventListener('pointerleave', resume);
    };
  }, []);

  return (
    <div ref={ref} className={styles.toast} role="status">
      <span className={styles.message}>{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          className={styles.action}
          onFocus={() => {
            setPaused(true);
          }}
          onBlur={() => {
            setPaused(false);
          }}
          onClick={() => {
            onAction();
            onDismiss();
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
