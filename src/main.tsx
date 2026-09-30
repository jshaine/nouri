import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/ui/tokens/index.css';
import { App } from '@/app';
import { openRepositories } from '@/data';
import { registerServiceWorker, updateStore } from '@/app/pwa';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

const repos = openRepositories();

createRoot(root).render(
  <StrictMode>
    <App repos={repos} />
  </StrictMode>,
);

// A new version waits until the user taps Reload in the update prompt.
registerServiceWorker((apply) => {
  updateStore.offer(apply);
});
