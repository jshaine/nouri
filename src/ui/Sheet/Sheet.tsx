import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton';
import styles from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  /** Called on Escape, the close button or a tap on the backdrop. */
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Sticky actions pinned to the bottom, within thumb reach. */
  footer?: ReactNode;
}

/**
 * Bottom sheet built on the native modal <dialog>, which traps focus, makes
 * the page behind inert and restores focus when it closes.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // A tap on the backdrop lands on the <dialog> itself. Keyboard users close
  // with Escape or the Close button, so this pointer-only path is native.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) closeRef.current();
    };
    dialog.addEventListener('click', onBackdrop);
    return () => {
      dialog.removeEventListener('click', onBackdrop);
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: let the owner decide (it may need to keep unsaved input).
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.surface}>
        <span className={styles.handle} aria-hidden="true" />
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  );
}
