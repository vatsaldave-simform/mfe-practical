# Tasks: nx-workspace-bootstrap

## 1. Workspace Initialization

- [x] 1.1 `[root]` Run `npx create-nx-workspace@latest mfe-practical --preset=ts --nxCloud=skip --packageManager=npm` to scaffold the bare Nx workspace
- [x] 1.2 `[root]` Add Nx plugins: `nx add @nx/react @nx/node @nx/rspack @nx/eslint`
- [x] 1.3 `[root]` Verify `nx report` exits with code 0 and lists all installed plugins

## 2. TypeScript Base Configuration

- [x] 2.1 `[root]` Replace generated `tsconfig.base.json` — set `strict: true`, `strictNullChecks: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- [x] 2.2 `[root]` Add all `@shop/*` path aliases to `tsconfig.base.json` `compilerOptions.paths`:
  - `@shop/shared-models` → `libs/shared/models/src/index.ts`
  - `@shop/shared-data-access` → `libs/shared/data-access/src/index.ts`
  - `@shop/shared-ui` → `libs/shared/ui/src/index.ts`
  - `@shop/shared-utils` → `libs/shared/utils/src/index.ts`
- [x] 2.3 `[root]` Run `tsc --noEmit -p tsconfig.base.json` — confirm zero errors

## 3. Nx Configuration

- [x] 3.1 `[root]` Configure `nx.json` `targetDefaults`:
  - `build`: `cache: true`, `dependsOn: ["^build"]`
  - `test`: `cache: true`
  - `lint`: `cache: true`
  - `codegen`: `cache: true`, `inputs: ["graphqlSchema", "{projectRoot}/**/*.graphql"]`
  - `serve`: `cache: false` (explicit)
- [x] 3.2 `[root]` Configure `nx.json` `namedInputs`:
  - `default`: `["{projectRoot}/**/*", "sharedGlobals"]`
  - `sharedGlobals`: `["{workspaceRoot}/tsconfig.base.json", "{workspaceRoot}/nx.json"]`
  - `graphqlSchema`: `["{workspaceRoot}/libs/shared/models/src/graphql/**/*.graphql"]`

## 4. ESLint Flat Configuration

- [x] 4.1 `[root]` Create `eslint.config.ts` with `@typescript-eslint/recommended-type-checked`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`
- [x] 4.2 `[root]` Add `@nx/enforce-module-boundaries` rule to `eslint.config.ts` with the full constraint matrix from design.md D3:
  - `scope:app` → allowed to import `scope:lib`
  - `type:ui` → allowed to import `type:model`, `type:util` only
  - `type:data` → allowed to import `type:model`, `type:util` only
  - `type:api` → allowed to import `type:model`, `type:util`, other `type:api`; NOT usable by any `scope:app` except `type:api` apps
  - MFE remotes (`scope:app, type:feature`) → cannot import other `scope:app` projects
- [x] 4.3 `[root]` Add rules: `no-unused-vars: error`, `no-console: error`, `@typescript-eslint/no-explicit-any: error`
- [x] 4.4 `[root]` Run `nx affected -t lint` on the empty workspace — confirm zero violations

## 5. Prettier Configuration

- [x] 5.1 `[root]` Create `prettier.config.ts` with: `semi: true`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`, `tabWidth: 2`, `arrowParens: 'always'`
- [x] 5.2 `[root]` Add `.prettierignore` covering: `dist/`, `node_modules/`, `**/__generated__/`, `*.graphql` (schema files not formatted by Prettier)

## 6. Pre-commit Hooks

- [x] 6.1 `[root]` Install Husky: `npm install --save-dev husky` and run `npx husky init`
- [x] 6.2 `[root]` Install lint-staged: `npm install --save-dev lint-staged`
- [x] 6.3 `[root]` Configure `lint-staged` in `package.json`:
  ```json
  {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,json,md,yaml,yml}": ["prettier --write"]
  }
  ```
- [x] 6.4 `[root]` Set `.husky/pre-commit` to run `npx lint-staged`
- [x] 6.5 `[root]` Verify hook fires: make a deliberate formatting error in a `.ts` file, run `git commit`, confirm Prettier fixes it and commit succeeds

## 7. Vitest Configuration

- [x] 7.1 `[root]` Install Vitest deps: `npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
- [x] 7.2 `[root]` Create `vitest.workspace.ts` at root:
  ```ts
  export default ['apps/*/vitest.config.ts', 'libs/**/vitest.config.ts'];
  ```
- [x] 7.3 `[root]` Document the per-project vitest.config.ts convention:
  - Frontend projects (apps/shell, apps/catalog, etc.): `environment: 'jsdom'`
  - Backend projects (apps/api, libs/api/\*): `environment: 'node'`
  - Shared libs (libs/shared/\*): `environment: 'node'` unless they contain React components (`type:ui` → jsdom)

## 8. Project Scaffold — Apps

- [x] 8.1 `[shell]` Generate `apps/shell` as an empty Nx project with `project.json` tags: `["scope:app", "type:feature"]` (parallel)
- [x] 8.2 `[catalog]` Generate `apps/catalog` with tags: `["scope:app", "type:feature"]` (parallel)
- [x] 8.3 `[cart]` Generate `apps/cart` with tags: `["scope:app", "type:feature"]` (parallel)
- [x] 8.4 `[checkout]` Generate `apps/checkout` with tags: `["scope:app", "type:feature"]` (parallel)
- [x] 8.5 `[account]` Generate `apps/account` with tags: `["scope:app", "type:feature"]` (parallel)
- [x] 8.6 `[api]` Generate `apps/api` with tags: `["scope:app", "type:api"]` (parallel)
- [ ] 8.7 `[api-runtime]` Align `apps/api` to backend runtime intent: Node/Express app entrypoint (`src/main.ts`), no browser entrypoint (`src/main.tsx`) and no `index.html`

## 9. Project Scaffold — Shared Libs

- [ ] 9.1 `[shared-models]` Generate `libs/shared/models` as TypeScript-only (`@nx/js:library --bundler=none`) with tags: `["scope:lib", "type:model"]` (parallel)
- [ ] 9.2 `[shared-data-access]` Generate `libs/shared/data-access` as TypeScript-only core (`@nx/js:library --bundler=none`) with tags: `["scope:lib", "type:data"]` (parallel)
- [ ] 9.3 `[shared-ui]` Generate `libs/shared/ui` as React library (`@nx/react:library --bundler=none`) with tags: `["scope:lib", "type:ui"]` (parallel)
- [ ] 9.4 `[shared-utils]` Generate `libs/shared/utils` as TypeScript-only (`@nx/js:library --bundler=none`) with tags: `["scope:lib", "type:util"]` (parallel)

## 10. Project Scaffold — API Libs

- [ ] 10.1 `[api-auth]` Generate `libs/api/auth` as TypeScript-only backend lib (`@nx/js:library --bundler=none`) with tags: `["scope:lib", "type:api"]` (parallel)
- [ ] 10.2 `[api-products]` Generate `libs/api/products` as TypeScript-only backend lib (`@nx/js:library --bundler=none`) with tags: `["scope:lib", "type:api"]` (parallel)
- [ ] 10.3 `[api-cart]` Generate `libs/api/cart` as TypeScript-only backend lib (`@nx/js:library --bundler=none`) with tags: `["scope:lib", "type:api"]` (parallel)
- [ ] 10.4 `[api-orders]` Generate `libs/api/orders` as TypeScript-only backend lib (`@nx/js:library --bundler=none`) with tags: `["scope:lib", "type:api"]` (parallel)

## 11. Verification

- [ ] 11.1 `[root]` Run `nx graph` — confirm all 14 projects appear with correct tags, zero graph errors
- [ ] 11.2 `[root]` Run `nx show projects --json` — confirm each project has exactly 2 tags matching the taxonomy table in spec
- [ ] 11.3 `[root]` Deliberately import a remote from another remote in a temp file, run `nx affected -t lint` — confirm module boundary violation is reported, then revert
- [ ] 11.4 `[root]` Deliberately import a `libs/api/*` lib from a frontend app in a temp file — confirm module boundary violation fires, then revert
- [ ] 11.5 `[root]` Run `tsc --noEmit` — confirm zero TypeScript errors across the workspace
- [ ] 11.6 `[api-runtime]` Verify `apps/api` is server-oriented: no React DOM mount, no HTML entry file, and Vitest uses `environment: 'node'`
