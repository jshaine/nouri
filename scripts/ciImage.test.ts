import { readProjectFile } from '../src/test/readProjectFile';

/** The CI container ships browsers for one Playwright version; keep them in step. */
describe('CI Playwright image', () => {
  it('matches the pinned @playwright/test version', () => {
    const pkg = JSON.parse(readProjectFile('package.json')) as {
      devDependencies: Record<string, string>;
    };
    const pinned = pkg.devDependencies['@playwright/test'];
    expect(pinned).toMatch(/^\d+\.\d+\.\d+$/);
    expect(readProjectFile('.github/workflows/ci.yml')).toContain(
      `mcr.microsoft.com/playwright:v${pinned}-noble`,
    );
  });
});
