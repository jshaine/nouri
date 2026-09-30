import { useEffect } from 'react';
import type { SettingsRepository } from '@/data';
import { applyTheme } from './applyTheme';
import { writeThemeMirror } from './themeMirror';

/** Keeps the document theme and its startup mirror in step with the saved setting. */
export function useThemeSync(settings: SettingsRepository): void {
  useEffect(() => {
    const sub = settings.live().subscribe((s) => {
      applyTheme(s.theme);
      writeThemeMirror(s.theme);
    });
    return () => {
      sub.unsubscribe();
    };
  }, [settings]);
}
