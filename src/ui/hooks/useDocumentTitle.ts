import { useEffect } from 'react';

export const APP_NAME = 'Nouri';

/** "Today · Nouri", so tabs and history entries are distinguishable. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);
}
