## Why

The shopping app requires a monorepo that can host a React 19 shell, four MFE remotes, an Express/GraphQL backend, and shared libraries — all with enforced module boundaries, independent caching, and a consistent toolchain. Without a correctly configured Nx workspace as the foundation, every subsequent change (apps, libs, CI/CD) will be built on unstable ground. This must be the first thing that exists.

## What Changes

- Initialize a bare Nx workspace (`preset=ts`) with `@shop` as the org prefix
- Install and configure `@nx/react`, `@nx/node`, `@nx/rspack`, `@nx/eslint`, `@nx/jest` (vitest), `@nx/playwright` plugins
- Declare `apps/api` as a Node/Express GraphQL backend app (`scope:app`, `type:api`) and treat the current React-style scaffold as temporary drift to be corrected in this change
- Define library framework policy for scaffolded libs:
  - React library: `libs/shared/ui`
  - TypeScript-only libraries: `libs/shared/models`, `libs/shared/data-access`, `libs/shared/utils`, `libs/api/*`
- Configure `nx.json` with `targetDefaults` caching for `build`, `test`, `lint`, `codegen`; `serve` explicitly NOT cached
- Configure `tsconfig.base.json` with strict mode and all `@shop/*` path aliases pre-defined for every planned app and lib
- Configure ESLint flat config (`eslint.config.ts`) with `@nx/enforce-module-boundaries` encoding the full constraint matrix:
  - `libs/shared/*` usable by anything
  - `libs/api/*` usable only by `apps/api`
  - MFE remotes cannot import from each other
- Configure Prettier (`prettier.config.ts`) with consistent formatting rules
- Configure Husky + lint-staged for pre-commit: `eslint --fix` + `prettier --write`
- Configure `vitest.workspace.ts` root file that discovers per-project `vitest.config.ts` files
- Create the `apps/` and `libs/` directory structure (empty, tagged) for all planned projects so Nx graph and module boundary rules work immediately

## Capabilities

### New Capabilities

- `nx-workspace-setup`: The configured Nx monorepo root — `nx.json`, `tsconfig.base.json`, `eslint.config.ts`, `prettier.config.ts`, `package.json`, `vitest.workspace.ts`, Husky hooks, and the full directory scaffold with Nx project tags for all planned apps and libs.

### Modified Capabilities

_(none — this is the initial bootstrap)_

## Impact

- **All subsequent proposals depend on this change being complete** — no app or lib can be generated until the Nx workspace, path aliases, and module boundaries exist
- **Affected projects**: root workspace configuration plus app/lib scaffolds; `apps/api` must be server-oriented (Node/Express) rather than browser-oriented (React DOM)
- **Dependencies introduced**: `nx`, `@nx/react`, `@nx/node`, `@nx/rspack`, `@nx/eslint`, `typescript`, `eslint`, `prettier`, `husky`, `lint-staged`, `vitest`, `@vitest/coverage-v8`, `@playwright/test`
- **No breaking changes** — this is the initial state; nothing exists to break
- **Rollback plan**: Delete the workspace directory. Nothing downstream exists yet.
