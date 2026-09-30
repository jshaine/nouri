import { lazy, Suspense } from 'react';

// Dev-only component gallery; the import is dropped from production builds.
const UiGallery = import.meta.env.DEV ? lazy(() => import('./dev/UiGallery')) : null;

export function App() {
  if (UiGallery && window.location.hash === '#gallery') {
    return (
      <Suspense>
        <UiGallery />
      </Suspense>
    );
  }
  return (
    <main>
      <h1>Nouri</h1>
    </main>
  );
}
