# Spec: nx-workspace-setup

> Capability introduced by: `nx-workspace-bootstrap`

## Overview

A correctly configured Nx monorepo that serves as the foundation for all apps and libs in the shopping app. This spec covers the workspace root configuration — not individual apps or libs, but the scaffolding, tooling, and constraints that govern everything built on top.

---

## Scenarios

### Workspace Initialization

**Given** the developer runs `npx create-nx-workspace@latest` with `preset=ts`
**When** setup completes
**Then**:

- `nx.json` exists at the workspace root with `targetDefaults` for `build`, `test`, `lint`, `codegen` (all cached), and `serve` (not cached)
- `package.json` exists with `nx` and all `@nx/*` plugins as devDependencies, all pinned to the same version
- `tsconfig.base.json` exists with `strict: true`, `strictNullChecks: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`
- `nx report` exits with code 0

---

### Path Alias Resolution

**Given** `tsconfig.base.json` is configured with `@shop/*` path aliases
**When** a TypeScript file contains `import { X } from '@shop/shared-models'`
**Then**:

- The TypeScript compiler resolves the alias to `libs/shared/models/src/index.ts`
- No `ts(2307)` "Cannot find module" error is raised
- The following aliases are all resolvable:
  - `@shop/shared-models` → `libs/shared/models/src/index.ts`
  - `@shop/shared-data-access` → `libs/shared/data-access/src/index.ts`
  - `@shop/shared-ui` → `libs/shared/ui/src/index.ts`
  - `@shop/shared-utils` → `libs/shared/utils/src/index.ts`

---

### Module Boundary Enforcement

**Given** `@nx/enforce-module-boundaries` is configured in `eslint.config.ts`

**Happy path — valid import**:
**When** `apps/catalog` imports from `@shop/shared-ui`
**Then** ESLint reports no module boundary violation

**Error case — remote imports remote**:
**When** `apps/cart` contains `import { X } from 'catalog/...'` or any direct import from another MFE remote
**Then** ESLint reports: `"A project tagged with 'scope:app' cannot import a project tagged with 'scope:app'"`

**Error case — frontend imports backend lib**:
**When** `apps/shell` contains `import { X } from '@shop/api-auth'`
**Then** ESLint reports a module boundary violation because `type:api` libs are restricted to `apps/api` only

**Error case — shared lib imports app**:
**When** `libs/shared/ui` contains an import from `apps/shell`
**Then** ESLint reports a module boundary violation (libs cannot depend on apps)

---

### Project Tag Taxonomy

**Given** all projects are scaffolded with `project.json`
**When** `nx show projects --json` is run
**Then** every project has exactly two tags following the taxonomy:

| Project                   | Tags                        |
| ------------------------- | --------------------------- |
| `apps/api`                | `scope:app`, `type:api`     |
| `apps/shell`              | `scope:app`, `type:feature` |
| `apps/catalog`            | `scope:app`, `type:feature` |
| `apps/cart`               | `scope:app`, `type:feature` |
| `apps/checkout`           | `scope:app`, `type:feature` |
| `apps/account`            | `scope:app`, `type:feature` |
| `libs/shared/models`      | `scope:lib`, `type:model`   |
| `libs/shared/data-access` | `scope:lib`, `type:data`    |
| `libs/shared/ui`          | `scope:lib`, `type:ui`      |
| `libs/shared/utils`       | `scope:lib`, `type:util`    |
| `libs/api/auth`           | `scope:lib`, `type:api`     |
| `libs/api/products`       | `scope:lib`, `type:api`     |
| `libs/api/cart`           | `scope:lib`, `type:api`     |
| `libs/api/orders`         | `scope:lib`, `type:api`     |

---

### Linting & Formatting

**Given** `eslint.config.ts` and `prettier.config.ts` are configured
**When** `nx affected -t lint` runs on a clean workspace
**Then** it exits with code 0 and zero violations

**Given** a file has a formatting issue (trailing space, missing semicolon per Prettier rules)
**When** the developer runs `git commit`
**Then** Husky fires `lint-staged`, Prettier fixes the formatting automatically, and the commit succeeds with the fixed file

**Given** a file has an unfixable ESLint error (e.g., `any` type used)
**When** the developer runs `git commit`
**Then** Husky fires lint-staged, ESLint exits non-zero, and the commit is blocked with the error message shown

---

### Nx Target Caching

**Given** `nx run shared-models:build` has been run once and inputs haven't changed
**When** `nx run shared-models:build` is run again
**Then** Nx restores from cache and logs `[from cache]` — the build command is NOT re-executed

**Given** `apps/api/src/main.ts` has been modified
**When** `nx affected -t build` runs
**Then** only `apps/api` and its downward dependents are rebuilt — unchanged projects use cache

**Given** `apps/shell` is served via `nx run shell:serve`
**When** `nx run shell:serve` is run a second time
**Then** the serve command re-executes (is NOT cached) — the dev server starts fresh

---

### Vitest Configuration

**Given** `vitest.config.ts` exists in `apps/shell` with `environment: 'jsdom'`
**When** a test in `apps/shell` accesses `window.location`
**Then** `window` is defined and the test does not throw `ReferenceError: window is not defined`

**Given** `vitest.config.ts` exists in `apps/api` with `environment: 'node'`
**When** a test in `apps/api` accesses `process.env`
**Then** `process` is defined and the test runs without jsdom overhead

**Given** `vitest.workspace.ts` at root glob-discovers all per-project configs
**When** `npx vitest run` is executed at the workspace root
**Then** all test files across all projects are discovered and run

---

### Edge Cases

**Given** a developer accidentally adds `"dashboard"` as a remote in a future proposal
**When** `nx show projects` is run
**Then** no `apps/dashboard` project exists (it was not scaffolded in this change) and the linter catches any import referencing it

**Given** two `@shop/*` path aliases accidentally point to the same file
**When** `tsc --noEmit` runs
**Then** TypeScript emits a diagnostic (duplicate path) — the CI lint step catches this before merge
