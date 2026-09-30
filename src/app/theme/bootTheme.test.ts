import { readProjectFile } from '@/test/readProjectFile';
import { THEME_MIRROR_KEY } from './themeMirror';

/** The inline boot script in index.html must use the same key and values. */
describe('index.html theme boot script', () => {
  const html = readProjectFile('index.html');
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';

  it('reads the mirror key', () => {
    expect(script).toContain(`'${THEME_MIRROR_KEY}'`);
  });

  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    ['sepia', undefined],
    [null, undefined],
  ])('stored %j sets data-theme %j', (stored, expected) => {
    localStorage.clear();
    if (stored) localStorage.setItem(THEME_MIRROR_KEY, stored);
    delete document.documentElement.dataset.theme;
    // Runs our own inline script from index.html, exactly as the browser would.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
    new Function(script)();
    expect(document.documentElement.dataset.theme).toBe(expected);
  });
});
