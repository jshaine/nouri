import { readProjectFile } from '@/test/readProjectFile';
import { AA_NON_TEXT, AA_TEXT, contrastRatio, relativeLuminance } from './contrast';
import { blockAfter, readColorTokens } from './readTokens';

const css = readProjectFile('src/ui/tokens/tokens.css');

const light = readColorTokens(blockAfter(css, ':root {'));
const darkSystem = readColorTokens(blockAfter(css, ":root:not([data-theme='light'])"));
const darkForced = readColorTokens(blockAfter(css, ":root[data-theme='dark']"));

const TEXT_ROLES = ['ink', 'ink-muted', 'protein', 'carbs', 'fat', 'accent', 'danger'] as const;
const SURFACES = ['paper', 'card'] as const;

describe.each([
  ['light', light],
  ['dark', darkSystem],
])('%s palette', (_name, palette) => {
  it.each(TEXT_ROLES.flatMap((role) => SURFACES.map((surface) => [role, surface])))(
    '%s text on %s meets AA',
    (role, surface) => {
      expect(contrastRatio(palette[role]!, palette[surface]!)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it('keeps on-ink text readable on ink buttons', () => {
    expect(contrastRatio(palette['on-ink']!, palette.ink!)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('keeps the focus ring visible on every surface', () => {
    for (const surface of SURFACES) {
      expect(contrastRatio(palette.focus!, palette[surface]!)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });
});

describe('dark theme blocks', () => {
  it('forced dark matches system dark exactly', () => {
    expect(darkForced).toEqual(darkSystem);
  });

  it('overrides every light color', () => {
    expect(Object.keys(darkSystem).sort()).toEqual(Object.keys(light).sort());
  });
});

describe('contrast helpers', () => {
  it('computes the WCAG extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
  });

  it('rejects malformed colors', () => {
    expect(() => relativeLuminance('red')).toThrow(/6-digit hex/);
  });
});
