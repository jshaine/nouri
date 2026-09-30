import { renderHook, waitFor } from '@testing-library/react';
import { createTestRepositories } from '@/data/testing';
import { THEME_MIRROR_KEY } from './themeMirror';
import { useThemeSync } from './useThemeSync';

describe('useThemeSync', () => {
  it('applies the saved theme and mirrors it for the next launch', async () => {
    localStorage.clear();
    const { repos } = createTestRepositories();
    await repos.settings.set('theme', 'dark');
    renderHook(() => {
      useThemeSync(repos.settings);
    });
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBe('dark');

    await repos.settings.set('theme', 'system');
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBeUndefined();
    });
    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBeNull();
  });
});
