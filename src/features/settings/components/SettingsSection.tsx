import { useId, type ReactNode } from 'react';
import styles from './Settings.module.css';

/** A titled block on the Settings screen, ruled like the label. */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {children}
    </section>
  );
}
