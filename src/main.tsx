import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/ui/tokens/index.css';
import { App } from '@/app';
import { registerServiceWorker } from '@/app/pwa';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The in-app "New version available" prompt arrives in milestone 6; until
// then an update waits for all tabs to close rather than reloading silently.
registerServiceWorker(() => undefined);
