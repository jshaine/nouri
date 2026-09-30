import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/ui/tokens/index.css';
import { App } from '@/app';
import { openRepositories } from '@/data';
import { registerServiceWorker } from '@/app/pwa';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

const repos = openRepositories();

createRoot(root).render(
  <StrictMode>
    <App repos={repos} />
  </StrictMode>,
);

// The in-app "New version available" prompt arrives in milestone 6; until
// then an update waits for all tabs to close rather than reloading silently.
registerServiceWorker(() => undefined);
