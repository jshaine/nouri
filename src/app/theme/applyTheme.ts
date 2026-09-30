import type { ThemePreference } from '@/domain';

/** Must match --color-paper in src/ui/tokens/tokens.css (checked by tests). */
export const THEME_COLORS = { light: '#f5f0e6', dark: '#141311' } as const;

/**
 * Applies the appearance choice to the document. "system" removes the
 * override so the CSS media query decides; light/dark force it, and the
 * browser chrome color (meta theme-color) follows.
 */
export function applyTheme(preference: ThemePreference, doc: Document = document): void {
  const root = doc.documentElement;
  const metas = doc.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');

  if (preference === 'system') {
    delete root.dataset.theme;
    for (const meta of metas) {
      const scheme = meta.media.includes('dark') ? 'dark' : 'light';
      meta.content = THEME_COLORS[scheme];
    }
    return;
  }

  root.dataset.theme = preference;
  for (const meta of metas) meta.content = THEME_COLORS[preference];
}
