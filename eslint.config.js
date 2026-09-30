import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Layer boundaries (see ARCHITECTURE.md). Cross-folder imports must use the
 * `@/` alias so these patterns can see them; deep relative climbs are banned.
 */
const noDeepRelative = {
  group: ['../../*'],
  message: 'Use the @/ alias for imports that leave the current folder.',
};
const react = {
  group: ['react', 'react-dom', 'react-dom/*', 'react-router', 'react/*'],
  message: 'This layer must not depend on React.',
};
const dexie = { group: ['dexie', 'dexie/*'], message: 'Only src/data may use Dexie.' };
const layer = (name, why) => ({ group: [`@/${name}`, `@/${name}/**`], message: why });
const featureInternals = {
  group: ['@/features/*/**'],
  message: 'Import other features only through their index.ts (e.g. @/features/today).',
};

const restrict = (...patterns) => ['error', { patterns: [noDeepRelative, ...patterns] }];

export default tseslint.config(
  {
    ignores: ['dist', 'dev-dist', 'coverage', 'playwright-report', 'test-results', 'public'],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    languageOptions: { globals: globals.browser },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,
      'no-restricted-imports': restrict(),
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    languageOptions: { globals: globals.es2023 },
    rules: {
      'no-restricted-imports': restrict(
        react,
        dexie,
        layer('data', 'domain must not depend on data.'),
        layer('ui', 'domain must not depend on ui.'),
        layer('features', 'domain must not depend on features.'),
        layer('app', 'domain must not depend on app.'),
      ),
      'no-restricted-globals': [
        'error',
        ...[
          'window',
          'document',
          'navigator',
          'localStorage',
          'indexedDB',
          'fetch',
          'self',
          'process',
        ].map((name) => ({ name, message: 'domain is pure TypeScript: no browser APIs.' })),
      ],
    },
  },
  {
    files: ['src/data/**/*.ts'],
    rules: {
      'no-restricted-imports': restrict(
        react,
        layer('ui', 'data must not depend on ui.'),
        layer('features', 'data must not depend on features.'),
        layer('app', 'data must not depend on app.'),
      ),
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(
        dexie,
        layer('data', 'ui is presentational: no data access.'),
        layer('features', 'ui must not depend on features.'),
        layer('app', 'ui must not depend on app.'),
      ),
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(
        dexie,
        featureInternals,
        layer('app', 'features must not depend on app.'),
      ),
    },
  },
  {
    files: ['src/features/*/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(
        dexie,
        featureInternals,
        layer('app', 'features must not depend on app.'),
        layer('data', 'Presentational components must not touch data; use a container.'),
        {
          group: ['../containers/*', '../hooks/*'],
          message: 'Presentational components receive props only.',
        },
      ),
    },
  },
  {
    files: ['scripts/**/*.ts', 'e2e/**/*.ts', '*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**', 'e2e/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  prettier,
);
