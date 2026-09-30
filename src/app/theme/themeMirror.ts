import { isThemePreference, type ThemePreference } from '@/domain';

/**
 * A copy of the theme preference in localStorage, read by the inline script
 * in index.html before first paint so dark mode doesn't flash light. The
 * database stays the source of truth; this is only a startup hint, and every
 * access tolerates storage being unavailable (private mode, blocked storage).
 */
export const THEME_MIRROR_KEY = 'nouri.theme';

export function readThemeMirror(storage: Storage | undefined = safeStorage()): ThemePreference {
  try {
    const value = storage?.getItem(THEME_MIRROR_KEY);
    return isThemePreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function writeThemeMirror(
  preference: ThemePreference,
  storage: Storage | undefined = safeStorage(),
): void {
  try {
    if (preference === 'system') storage?.removeItem(THEME_MIRROR_KEY);
    else storage?.setItem(THEME_MIRROR_KEY, preference);
  } catch {
    // Storage blocked: the app still follows the saved setting once loaded.
  }
}

function safeStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
