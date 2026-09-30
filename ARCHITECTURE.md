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
