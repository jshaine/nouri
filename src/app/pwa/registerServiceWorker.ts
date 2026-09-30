import { registerSW } from 'virtual:pwa-register';

export type UpdateListener = (applyUpdate: () => Promise<void>) => void;

/**
 * Registers the service worker in "prompt" mode: a new version never
 * activates on its own, so unsaved input is never lost to a silent reload.
 * `onUpdateAvailable` receives a callback that activates it and reloads.
 */
export function registerServiceWorker(onUpdateAvailable: UpdateListener): void {
  if (!('serviceWorker' in navigator)) return;
  const updateSW = registerSW({
    onNeedRefresh() {
      onUpdateAvailable(() => updateSW(true));
    },
  });
}
