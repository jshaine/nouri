import { readThemeMirror, THEME_MIRROR_KEY, writeThemeMirror } from './themeMirror';

const throwing = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
} as unknown as Storage;

describe('theme mirror', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores forced themes and clears for system', () => {
    writeThemeMirror('dark');
    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBe('dark');
    expect(readThemeMirror()).toBe('dark');
    writeThemeMirror('system');
    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBeNull();
    expect(readThemeMirror()).toBe('system');
  });

  it('ignores unknown stored values', () => {
    localStorage.setItem(THEME_MIRROR_KEY, 'sepia');
    expect(readThemeMirror()).toBe('system');
  });

  it('survives blocked storage', () => {
    expect(readThemeMirror(throwing)).toBe('system');
    expect(() => {
      writeThemeMirror('dark', throwing);
    }).not.toThrow();
  });
});
