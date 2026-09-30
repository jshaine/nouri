import { lazy, Suspense, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import type { Repositories } from '@/data';
import { appRoutes } from './routes';
import { useThemeSync } from './theme';

// Dev-only component gallery; the import is dropped from production builds.
const UiGallery = import.meta.env.DEV ? lazy(() => import('./dev/UiGallery')) : null;

export interface AppProps {
  repos: Repositories;
}

export function App({ repos }: AppProps) {
  useThemeSync(repos.settings);
  const [router] = useState(() =>
    createBrowserRouter(appRoutes(repos), {
      // Matches Vite's base, so the app also works from a subpath like /nouri/.
      basename: import.meta.env.BASE_URL,
    }),
  );

  if (UiGallery && window.location.hash === '#gallery') {
    return (
      <Suspense>
        <UiGallery />
      </Suspense>
    );
  }
  return <RouterProvider router={router} />;
}
