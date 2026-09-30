import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  /** One line telling the user what to do next. */
  children?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, children, action }: EmptyStateProps) {
  return (
    <section className={styles.empty}>
      {Icon && <Icon className={styles.icon} aria-hidden="true" />}
      <h2 className={styles.title}>{title}</h2>
      {children && <p className={styles.body}>{children}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}
