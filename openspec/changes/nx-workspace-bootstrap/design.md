## Context

No Nx workspace exists yet. The workspace root (`/home/vatsal/Desktop/mfe-practical`) currently contains only the OpenSpec configuration. Before any application code, shared libraries, or CI pipelines can be built, a correctly wired Nx monorepo must be in place with:

- The right plugin set for React (Rspack + MF v2), Node.js (Express), and testing
- A TypeScript base config in strict mode with all `@shop/*` path aliases pre-declared
- ESLint flat config with `@nx/enforce-module-boundaries` encoding the full constraint matrix
- Nx target caching tuned to the workload (build, test, lint, codegen cached; serve not)
- Pre-commit hooks (Husky + lint-staged) enforcing code quality from commit one
- Per-project Vitest configs for correct runtime environments (jsdom vs node)

## Goals / Non-Goals

**Goals:**

- Produce a runnable Nx workspace where `nx report` and `nx graph` work cleanly
- Encode all module boundary rules so violations are caught by the linter from day one
- Pre-declare all `@shop/*` path aliases so subsequent proposals can use them immediately
- Establish consistent code quality tooling (ESLint, Prettier, Husky) before any source exists
- Define the Nx project tag taxonomy applied to every future app and lib

**Non-Goals:**

- Writing any application source code (no `src/` files in apps or libs)
- Installing MFE-specific dependencies (`@module-federation/enhanced`, `@apollo/client`) — those belong in proposals that create the apps
- Setting up CI/CD pipelines — that is Proposal 9
- Database setup (Prisma) — that belongs in the API proposal

## Decisions

### D1 — Nx init preset: `ts` (not `react-monorepo` or `node`)

**Decision**: Use `npx create-nx-workspace@latest --preset=ts`

**Rationale**: The `react-monorepo` preset generates a Webpack-based React app immediately. Since we're using Rspack + Module Federation v2, that generated app would need to be discarded or heavily modified. Starting with `preset=ts` gives a clean slate where we add only what we need: `@nx/react`, `@nx/node`, `@nx/rspack`, `@nx/eslint`, `@nx/vite` (for Vitest).

**Alternative rejected**: `preset=react-monorepo` — bakes in Webpack assumptions and generates boilerplate we'd have to undo.

---

### D2 — Tag taxonomy: `scope` + `type` two-axis system

**Decision**:

```
scope:app   → apps/* (deployable units: api, shell, catalog, cart, checkout, account)
scope:lib   → libs/* (shared or domain libraries)

type:feature → cross-cutting feature code (apps + feature libs)
type:ui      → React component libraries (libs/shared/ui)
type:data    → data access / codegen (libs/shared/data-access)
type:util    → pure utilities, no framework (libs/shared/utils)
type:model   → types, enums, GraphQL schema files (libs/shared/models)
type:api     → Express resolvers, backend domain libs (libs/api/*)
```

**Rationale**: Two axes give enough granularity for module boundary rules without becoming unmaintainable. Adding a third axis (e.g., `domain`) would be needed only if we had 10+ teams.

---

### D3 — Module boundary constraint matrix

**Decision**: Encode the following constraints in `@nx/enforce-module-boundaries`:

| Consumer tag                           | Allowed to import                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `scope:app`                            | `scope:lib` (any)                                                                                                         |
| `type:ui`                              | `type:model`, `type:util`                                                                                                 |
| `type:data`                            | `type:model`, `type:util`                                                                                                 |
| `type:api`                             | `type:model`, `type:util`, other `type:api` (same `scope:lib`)                                                            |
| `scope:app, type:feature` (MFE remote) | `scope:lib, type:ui`, `scope:lib, type:data`, `scope:lib, type:util`, `scope:lib, type:model` — NEVER another `scope:app` |

**Critical rule**: `type:api` libs can only be used by `apps/api` (tagged `scope:app, type:api`). No frontend app can import backend resolver code.

**Alternative rejected**: No boundary enforcement — lets circular deps accumulate silently until they cause bundling failures in production.

---

### D4 — Vitest: per-project configs, not a root workspace file

**Decision**: Each project has its own `vitest.config.ts`. The root `vitest.workspace.ts` auto-discovers them via glob patterns but does not override environment settings.

**Rationale**: Frontend projects (React components) require `jsdom` environment. Backend projects (Express resolvers) require `node` environment. A single root config cannot express both. Per-project configs with correct `environment` settings prevent tests from passing locally with wrong globals (e.g., `window` being defined in a Node test).

---

### D5 — ESLint flat config (`eslint.config.ts`) at root

**Decision**: Use ESLint's flat config format (not `.eslintrc.json`). The root config covers all projects; individual projects can extend with project-specific overrides.

**Rationale**: ESLint v9+ defaults to flat config. The `@nx/eslint` plugin has full flat config support. This avoids the fragmentation of per-project `.eslintrc` files that drift over time.

---

### D6 — Pre-declared path aliases in `tsconfig.base.json`

**Decision**: All `@shop/*` aliases for every planned app and lib are declared in `tsconfig.base.json` at workspace init, even before the projects are generated.

```json
{
  "paths": {
    "@shop/shared-models": ["libs/shared/models/src/index.ts"],
    "@shop/shared-data-access": ["libs/shared/data-access/src/index.ts"],
    "@shop/shared-ui": ["libs/shared/ui/src/index.ts"],
    "@shop/shared-utils": ["libs/shared/utils/src/index.ts"]
  }
}
```

**Rationale**: Declaring aliases upfront means the TypeScript compiler resolves imports correctly the moment a lib's `src/index.ts` is created. No need to touch `tsconfig.base.json` in every subsequent proposal.

---

### D7 — `nx.json` target caching strategy

**Decision**:

```json
{
  "targetDefaults": {
    "build": { "cache": true, "dependsOn": ["^build"] },
    "test": { "cache": true },
    "lint": { "cache": true },
    "codegen": {
      "cache": true,
      "inputs": ["graphqlSchema", "{projectRoot}/**/*.graphql"]
    },
    "serve": { "cache": false }
  }
}
```

**Rationale**: `codegen` must be cached with schema files as inputs — otherwise every CI run regenerates GraphQL types even when the schema hasn't changed. `serve` must never be cached — a cached serve target would not start the dev server. `build` uses `dependsOn: ["^build"]` to ensure libs are built before apps that depend on them.

## Risks / Trade-offs

| Risk                                                                     | Mitigation                                                                                                                 |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Module boundary rules too strict → blocks legitimate imports             | Start permissive on `scope:app` rules, tighten as patterns emerge. The linter warns, it doesn't block deploys.             |
| Nx plugin version mismatches                                             | Pin all `@nx/*` packages to the same version in `package.json`. Use `nx migrate` for upgrades, never manual version bumps. |
| `tsconfig.base.json` aliases declared for non-existent libs → tsc errors | Aliases that point to non-existent files are silently ignored by tsc until a file imports them. Not a real-world risk.     |
| Husky hooks slow down commits                                            | lint-staged runs only on staged files. Even on large changesets, this is <5s.                                              |
| `vitest.workspace.ts` discovers test files in `node_modules`             | Ensure `exclude: ['**/node_modules/**']` in root vitest config.                                                            |

## Migration Plan

1. Run `npx create-nx-workspace@latest mfe-practical --preset=ts --nxCloud=skip`
2. Add Nx plugins: `nx add @nx/react @nx/node @nx/rspack @nx/eslint`
3. Replace generated `tsconfig.base.json` with strict config + all `@shop/*` aliases
4. Replace generated ESLint config with flat config + module boundary rules
5. Configure `nx.json` targetDefaults as specified in D7
6. Install and configure Husky + lint-staged
7. Create `vitest.workspace.ts` root discovery file
8. Create empty `apps/` and `libs/` scaffolding directories with `project.json` stubs and correct tags
9. Run `nx graph` — verify all projects appear with correct tags
10. Run `nx affected -t lint` — verify module boundary rules fire on a deliberate bad import

**Rollback**: Delete the workspace directory. No downstream artifacts exist at this stage.
