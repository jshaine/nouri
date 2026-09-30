import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

export interface TabsProps<T extends string> {
  /** Accessible name for the tab list. */
  label: string;
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Content of the selected tab. */
  children: ReactNode;
}

const NEXT_KEYS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

/** WAI-ARIA tabs with automatic activation: arrows, Home and End move and select. */
export function Tabs<T extends string>({ label, tabs, value, onChange, children }: TabsProps<T>) {
  const baseId = useId();
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const tabId = (id: T) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  const select = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    if (!tab) return;
    onChange(tab.id);
    refs.current.get(tab.id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = tabs.findIndex((t) => t.id === value);
    const delta = NEXT_KEYS[event.key];
    if (delta !== undefined) select(current + delta);
    else if (event.key === 'Home') select(0);
    else if (event.key === 'End') select(tabs.length - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div className={styles.tabs}>
      <div role="tablist" aria-label={label} className={styles.list}>
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) refs.current.set(tab.id, el);
                else refs.current.delete(tab.id);
              }}
              id={tabId(tab.id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className={styles.tab}
              onClick={() => {
                onChange(tab.id);
              }}
              onKeyDown={onKeyDown}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={tabId(value)} className={styles.panel}>
        {children}
      </div>
    </div>
  );
}
