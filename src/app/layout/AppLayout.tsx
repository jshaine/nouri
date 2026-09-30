import { Outlet } from 'react-router';
import { TabBar } from './TabBar';
import styles from './AppLayout.module.css';

/** Screen content first in the DOM (no skip link needed), then the tab bar. */
export function AppLayout() {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
