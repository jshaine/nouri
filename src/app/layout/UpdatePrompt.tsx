import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/ui';
import type { UpdateStore } from '../pwa/updateStore';
import styles from './UpdatePrompt.module.css';

/**
 * "New version available. Reload?" Updating is always the user's choice, so
 * nothing being typed is ever lost to a surprise reload.
 */
export function UpdatePrompt({ store }: { store: UpdateStore }) {
  const state = useSyncExternalStore(store.subscribe, store.get);
  const [reloading, setReloading] = useState(false);
  if (!state.available) return null;
  return (
    <div className={styles.prompt} role="status">
      <p>
        <b>A new version of Nouri is ready.</b> Finish what you’re typing, then reload to update.
      </p>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={store.dismiss}>
          Later
        </Button>
        <Button
          variant="primary"
          disabled={reloading}
          onClick={() => {
            setReloading(true);
            void state.apply?.();
          }}
        >
          {reloading ? 'Reloading…' : 'Reload'}
        </Button>
      </div>
    </div>
  );
}
