# Architecture

Nouri is a static, offline-first PWA. There is no backend: all data lives in
IndexedDB on the device, and the food database ships as `public/foods.json`.

## Layers

| Folder                 | What lives here                                                                                                                 | May import                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `src/domain/`          | Pure TypeScript business logic: nutrition math, goal calculator, date helpers, validation. No React, no Dexie, no browser APIs. | nothing outside `domain`                           |
| `src/data/`            | The only layer that touches Dexie/IndexedDB: schema, migrations, one repository per entity. Repositories return domain types.   | `domain`                                           |
| `src/ui/`              | Shared design system: dumb, reusable components + design tokens.                                                                | `domain` (types/constants)                         |
| `src/features/<name>/` | One folder per feature, with `components/` (presentational), `containers/` (wiring), `hooks/`, and a public `index.ts`.         | `domain`, `data`, `ui`, other features' `index.ts` |
| `src/app/`             | Routing, providers, layout shell, PWA registration.                                                                             | everything                                         |
| `scripts/`             | Build-time Node scripts (food data pipeline). Never bundled.                                                                    | `src/domain`                                       |

## Rules (enforced by ESLint `no-restricted-imports`)

- Imports that leave the current folder use the `@/` alias; `../../` is banned,
  so the layer rules can see every cross-folder import.
- `domain` cannot import React, Dexie, `data`, `ui`, `features` or `app`, and
  cannot use browser globals (`window`, `document`, `fetch`, ...).
- `data` cannot import React, `ui`, `features` or `app`.
- `ui` cannot import Dexie, `data`, `features` or `app`.
- Features import other features only through `@/features/<name>` (their
  `index.ts`), never their internals.
- `features/*/components/` are presentational: they receive props and emit
  callbacks. They cannot import `data`, containers or hooks.

## Data

- `src/data/db.ts` defines the Dexie schema. Changing it follows
  [src/data/MIGRATIONS.md](src/data/MIGRATIONS.md): never edit a released
  version, always add one with an upgrade.
- `src/data/rows.ts` holds row shapes (plain JSON, so backups round-trip).
  Repositories (`src/data/repositories/`) convert rows to domain types; nothing
  else sees rows.
- Reads that the UI shows are live queries (`Live<T>`). Screens consume them
  with `useLive` from `@/ui`, a generic hook that knows nothing about Dexie.
- Entries store a snapshot (name, source, totals) so editing or deleting a food
  never changes past days.
- Tests use `createTestRepositories()` from `src/data/testing.ts`: a fresh
  fake-indexeddb database with a controllable clock and sequential ids.

## Features and wiring

- `src/main.tsx` opens the repositories once and passes them to `App`, and
  `src/app/routes.tsx` hands each screen the repositories it needs as props.
  (Features can't import `app`, and `data` has no React, so there is no shared
  context layer; explicit props also make container tests use real
  repositories on fake-indexeddb.)
- Features so far: `today` (Daily Facts label, meals, date switcher, edit,
  delete + undo), `add-food` (Add sheet, custom food form), `food-detail`
  (portion, quantity, meal, Add to log), `goals` (manual goal editor) and
  `settings`.
- When a presentational list needs per-row behavior (e.g. long-press), the
  component takes a render prop and a small container supplies the row, so
  components never import hooks or containers.
- Controls bound to live settings keep the tapped value locally until the
  saved value arrives, so they never flicker back.

## Design system

Visual rules and tokens are documented in [DESIGN.md](DESIGN.md). Tokens live in
`src/ui/tokens/` (CSS custom properties plus contrast tests); the theme
override is applied by `src/app/theme`. Shared components are exported from
`src/ui/index.ts`; run `npm run dev` and open `/#gallery` to see them all
(dev-only, not in production builds).

## Conventions

- TypeScript strict; no `any`, no non-null assertions outside tests.
- Components ~150 lines, any file ~250 lines max; split before merging.
- No magic numbers in components: constants live in `domain` or design tokens.
- Tests sit next to the code (`*.test.ts[x]`). Domain coverage must stay ≥ 90%.
