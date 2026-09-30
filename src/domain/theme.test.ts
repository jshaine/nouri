import { isThemePreference } from './theme';

describe('isThemePreference', () => {
  it.each(['system', 'light', 'dark'])('accepts %s', (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each(['auto', '', null, undefined, 1])('rejects %s', (value) => {
    expect(isThemePreference(value)).toBe(false);
  });
});
