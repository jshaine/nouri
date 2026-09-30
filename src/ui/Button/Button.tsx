import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Pill shape, used for the floating Add action. */
  pill?: boolean;
  /** Stretch to the container width. */
  block?: boolean;
  icon?: LucideIcon;
}

export function Button({
  variant = 'secondary',
  pill = false,
  block = false,
  icon: Icon,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], pill && styles.pill, block && styles.block]
    .concat(className)
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} {...rest}>
      {Icon && <Icon className={styles.icon} aria-hidden="true" />}
      {children}
    </button>
  );
}
