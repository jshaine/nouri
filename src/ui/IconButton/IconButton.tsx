import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Accessible name; icon-only buttons must always have one. */
  label: string;
}

export function IconButton({
  icon: Icon,
  label,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[styles.button, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <Icon className={styles.icon} aria-hidden="true" />
    </button>
  );
}
