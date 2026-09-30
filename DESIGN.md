# Design system: "Daily Facts"

Nouri's identity is the nutrition facts label: heavy black rules, condensed
heavy numbers, and one color per macro used everywhere. Direction was set with
the ui-ux-pro-max skill and approved on 2026-09-30.

Tokens live in `src/ui/tokens/tokens.css`. Components read tokens only; no raw
colors, sizes or durations.

## Color

| Token               | Light     | Dark      | Use                                |
| ------------------- | --------- | --------- | ---------------------------------- |
| `--color-paper`     | `#f5f0e6` | `#141311` | Page background                    |
| `--color-card`      | `#fffdf8` | `#1d1c19` | Label panel, rows, sheets          |
| `--color-ink`       | `#1c1b18` | `#f2ede3` | Text, label rules, primary buttons |
| `--color-ink-muted` | `#5e5a52` | `#ada79b` | Secondary text                     |
| `--color-protein`   | `#1d6a86` | `#6bbad6` | Protein, everywhere                |
| `--color-carbs`     | `#8c5a00` | `#e3ae4a` | Carbs, everywhere                  |
| `--color-fat`       | `#b4462f` | `#ee8c73` | Fat, everywhere                    |

- Every text color passes WCAG AA (4.5:1) on paper and card in both themes;
  `src/ui/tokens/tokens.test.ts` enforces it.
- Color is never the only signal: macros always carry their P/C/F letter and
  numbers.
- Going over a goal is not an error. The bar shows a striped overflow segment
  and "N over" in ink. Never red, never guilt copy. `--color-danger` is only
  for destructive actions and real errors.

## Type

Archivo variable (self-hosted, OFL), with weight 100–900 and width 62–125%.
Condensed heavy (`--stretch-condensed`, `--weight-black`) for label numbers
and headings; normal width for body text. Tabular numbers throughout.

Scale: 12 / 14 / 16 / 20 / 24 / 32 / 40 px (`--text-xs` … `--text-3xl`).

## Space, shape and motion

- Spacing: 4px base, `--space-1/2/3/4/6/8/12` (4/8/12/16/24/32/48). 16px gutter.
- Radius: label 0, rows 6px, sheet tops 16px, the Add button a pill.
- Flat: no shadows except `--shadow-sheet` on bottom sheets.
- Motion: 120–240ms, ease-out in, faster out; all durations drop to 0 under
  `prefers-reduced-motion`.
- Tap targets at least `--tap-min` (44px). Safe-area insets via `--safe-*`.

## Layout

Mobile first (360–430px). Content column max `--content-max` (560px). Bottom
tab bar on phones; at 900px and wider it becomes a left rail.

## Themes

`prefers-color-scheme` by default. Settings can force light or dark, which sets
`data-theme` on `<html>` (`applyTheme` in `src/app/theme`).

## Icons

`lucide-react`, 2px stroke, sizes `--icon-sm/md/lg` (16/20/24).
Decorative icons are `aria-hidden`; icon-only buttons have an accessible name.
