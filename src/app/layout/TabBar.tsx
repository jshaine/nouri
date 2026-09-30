import { ChartColumn, ClipboardList, Settings, UserRound, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import styles from './TabBar.module.css';

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const TABS: readonly Tab[] = [
  { to: '/', label: 'Today', icon: ClipboardList },
  { to: '/history', label: 'History', icon: ChartColumn },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
];

/** Bottom tab bar on phones; a left rail from the tablet breakpoint. */
export function TabBar() {
  return (
    <nav className={styles.bar} aria-label="Main">
      <ul className={styles.list}>
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} end className={styles.tab}>
              <Icon className={styles.icon} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
