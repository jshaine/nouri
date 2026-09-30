import { readProjectFile } from '@/test/readProjectFile';
import { THEME_COLORS, applyTheme } from './applyTheme';

const css = readProjectFile('src/ui/tokens/tokens.css');

function addMeta(media: string) {
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.media = media;
  document.head.append(meta);
  return meta;
}

describe('applyTheme', () => {
  let lightMeta: HTMLMetaElement;
  let darkMeta: HTMLMetaElement;

  beforeEach(() => {
    document.head.innerHTML = '';
    delete document.documentElement.dataset.theme;
    lightMeta = addMeta('(prefers-color-scheme: light)');
    darkMeta = addMeta('(prefers-color-scheme: dark)');
  });

  it('forces dark on the root and browser chrome', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(lightMeta.content).toBe(THEME_COLORS.dark);
    expect(darkMeta.content).toBe(THEME_COLORS.dark);
  });

  it('forces light', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(darkMeta.content).toBe(THEME_COLORS.light);
  });

  it('returns control to the OS for "system"', () => {
    applyTheme('dark');
    applyTheme('system');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(lightMeta.content).toBe(THEME_COLORS.light);
    expect(darkMeta.content).toBe(THEME_COLORS.dark);
  });

  it('uses the same paper colors as the tokens', () => {
    expect(css).toContain(`--color-paper: ${THEME_COLORS.light};`);
    expect(css).toContain(`--color-paper: ${THEME_COLORS.dark};`);
  });
});
