// ESLint 9 flat config for the mfe-practical Nx monorepo.
//
// Structure:
//   1. Global ignores
//   2. TypeScript: @typescript-eslint/recommended-type-checked (all .ts/.tsx)
//   3. React + React Hooks + jsx-a11y rules (.tsx/.jsx only)
//   4. Import plugin registration (for import order / resolution rules)
//   5. Nx module boundary enforcement (all files in the workspace)
//   6. Project-wide quality rules (no-console, no-explicit-any, etc.)

import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import nxPlugin from '@nx/eslint-plugin';

export default tseslint.config(
  // ---------------------------------------------------------------------------
  // 1. Global ignores
  // Keeps ESLint from trying to lint generated or vendored files.
  // ---------------------------------------------------------------------------
  {
    ignores: [
      'dist/**', // compiled outputs — not our source
      'node_modules/**', // third-party code
      '**/__generated__/**', // GraphQL codegen output — don't lint generated types
      'eslint.config.ts',
      'prettier.config.ts',
      'vitest.workspace.ts',
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. TypeScript type-checked rules — applied only to .ts / .tsx files.
  //
  // recommendedTypeChecked enables rules that require type information from the
  // TypeScript compiler (e.g. no-floating-promises, no-misused-promises).
  // projectService:true = auto-discover the nearest tsconfig.json per file,
  // which is the correct approach for Nx monorepos where each project has its
  // own tsconfig.
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: tseslint.configs.recommendedTypeChecked,
    languageOptions: {
      parserOptions: {
        // Automatically finds the tsconfig closest to each linted file.
        // No need to list every project's tsconfig manually here.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // 3. React rules — applied only to JSX/TSX files (UI components).
  //
  // - react/recommended + jsx-runtime: standard React rules; jsx-runtime
  //   suppresses the "React must be in scope" rule since React 17+ JSX transform
  //   doesn't require a manual import.
  // - react-hooks/recommended-latest: enforces rules of hooks (exhaustive-deps,
  //   rules-of-hooks). The "-latest" variant is the ESLint 9 flat-config build.
  // - jsx-a11y/recommended: catches common accessibility issues at lint time
  //   (missing alt text, invalid ARIA roles, etc.).
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.tsx', '**/*.jsx'],
    extends: [
      reactPlugin.configs.flat.recommended,
      // Disables rules that are unnecessary with the new JSX transform (React 17+)
      reactPlugin.configs.flat['jsx-runtime'],
    ],
    plugins: {
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      // Hooks rules (rules-of-hooks + exhaustive-deps)
      ...reactHooksPlugin.configs['recommended-latest'].rules,
      // Accessibility rules from jsx-a11y
      ...jsxA11yPlugin.configs.recommended.rules,
    },
    settings: {
      // Tell eslint-plugin-react which React version to target for its rules.
      // 'detect' reads from the installed react package automatically.
      react: { version: 'detect' },
    },
  },

  // ---------------------------------------------------------------------------
  // 4. Import plugin — registered for all TypeScript files.
  //
  // eslint-plugin-import provides rules like import/no-duplicates and
  // import/no-cycle. We register the plugin here so individual projects can
  // enable specific rules in their own config overrides if needed.
  // No bulk config spread because import v2's flat-config support is partial.
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-duplicates': 'error', // disallow duplicate import statements for the same module
    },
  },

  // ---------------------------------------------------------------------------
  // 5. Nx module boundary enforcement.
  //
  // Encodes the full constraint matrix from design.md D3. Projects are
  // tagged in project.json with two axes: scope (app|lib) + type (feature|ui|
  // data|util|model|api). The depConstraints below translate the matrix into
  // ESLint errors so violations are caught locally before CI.
  //
  // How depConstraints work:
  //   Each entry says "a project with <sourceTag> can ONLY depend on projects
  //   that have at least one tag from <onlyDependOnLibsWithTags>".
  //   Multiple entries for the same project are ANDed — both constraints must
  //   be satisfied simultaneously.
  // ---------------------------------------------------------------------------
  {
    plugins: {
      '@nx': nxPlugin,
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          // Raise an error if a buildable lib depends on a non-buildable lib.
          // Ensures the Nx build graph stays correct.
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // --- scope axis ---
            // Apps (scope:app) can only import from libs (scope:lib).
            // This covers the "MFE remote cannot import another remote" rule:
            // since all apps are scope:app, this stops any app-to-app import.
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: ['scope:lib'],
            },

            // --- type axis for apps ---
            // Feature apps (shell, catalog, cart, etc.) can use UI, data,
            // util, and model libs — but NOT type:api libs (backend resolvers).
            // This is the enforcement that keeps Express/GraphQL resolver code
            // out of React bundles.
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:data',
                'type:util',
                'type:model',
              ],
            },

            // --- type axis for libs ---
            // UI component libs can depend on models (for prop types) and utils
            // (for helpers), but not on data-access or other UI libs.
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:model', 'type:util'],
            },

            // Data-access libs (Apollo hooks, fetch wrappers) can depend on
            // models (for query input/output types) and utils, but not on UI.
            {
              sourceTag: 'type:data',
              onlyDependOnLibsWithTags: ['type:model', 'type:util'],
            },

            // API libs (Express resolvers) can depend on models (shared types),
            // utils, and other API libs (e.g. auth lib used by products lib).
            // They cannot be imported by frontend apps — that constraint is
            // enforced by the type:feature rule above.
            {
              sourceTag: 'type:api',
              onlyDependOnLibsWithTags: ['type:model', 'type:util', 'type:api'],
            },

            // Model libs are pure types/enums — they have no runtime deps.
            {
              sourceTag: 'type:model',
              onlyDependOnLibsWithTags: [],
            },

            // Util libs are framework-agnostic helpers — they may reference
            // model types but nothing else.
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:model'],
            },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 6. Project-wide quality rules — applied to all TypeScript files.
  //
  // - no-console: keeps debug logging out of production code. Use a proper
  //   logger library (e.g. pino) in apps/api instead.
  // - @typescript-eslint/no-explicit-any: forces every value to have a real
  //   type. If you need an escape hatch, use `unknown` + a type guard.
  // - no-unused-vars (base): disabled in favour of the TS-aware version which
  //   understands type-only imports and declaration merging.
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // Turn off the base rule — it incorrectly flags TS constructs like enums.
      // @typescript-eslint/no-unused-vars (from recommendedTypeChecked) replaces it.
      'no-unused-vars': 'off',
    },
  },
);
