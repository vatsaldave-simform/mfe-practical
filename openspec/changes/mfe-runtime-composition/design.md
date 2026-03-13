## Context

The workspace has all planned apps and libs scaffolded, but each frontend app is still independent boilerplate with no runtime federation contract. Shell routing and remote ownership are undefined, so teams could implement incompatible host/remote wiring, duplicate dependency versions, and brittle startup behavior.

This change introduces a single composition contract for `apps/shell` and four remotes (`catalog`, `cart`, `checkout`, `account`) using Module Federation v2 with Rspack in the existing Nx monorepo.

## Goals / Non-Goals

**Goals:**

- Define a single host/remote runtime contract before feature implementation starts.
- Standardize remote exposure shape (`./Module`) and shell route mounting.
- Guarantee minimal shared singleton behavior for core runtime dependencies while preserving independent deployments.
- Define failure isolation so one remote outage does not crash the shell.
- Define deterministic local dev orchestration for all frontend apps.

**Non-Goals:**

- Implementing business features inside remotes.
- Defining GraphQL schema, resolvers, or backend domain behavior.
- Introducing new state-management frameworks or styling systems.
- CI/CD optimization and deployment topology decisions.

## Decisions

### D1 — Federation model: shell host + 4 route remotes

**Decision:** `apps/shell` is the only host; `catalog`, `cart`, `checkout`, and `account` are remotes loaded by shell-owned routes.

**Rationale:** Single host ownership keeps navigation, error boundaries, and cross-cutting UI concerns centralized.

**Alternative rejected:** Peer-to-peer remote imports. This conflicts with existing module-boundary policy and increases coupling.

### D2 — Remote exposure contract: single `./Module`

**Decision:** Each remote exposes exactly one entry named `./Module`, exporting the top-level route component for shell mounting.

**Rationale:** A single public entry minimizes accidental API surface drift and keeps ownership explicit.

**Alternative rejected:** Multiple exposed modules per remote. This increases integration fragility and version-coordination overhead.

### D3 — Shared runtime dependencies: core-only singleton policy

**Decision:** Host and remotes share only `react` and `react-dom` as singletons by default. `@apollo/client`, `graphql`, and other libraries are not shared by default to reduce cross-release coupling.

**Rationale:** Independent deploys are safer when fewer libraries are shared at runtime. Sharing only UI-runtime singletons keeps React compatibility while minimizing version-mismatch blast radius.

**Alternative rejected:** Share all major dependencies as singletons. This increases coordinated-release pressure and weakens deploy independence.

### D4 — Shell-controlled failure isolation

**Decision:** Shell wraps each remote load with a route-level fallback and remote-failure boundary. A failed remote renders a local shell fallback while other routes continue functioning.

**Rationale:** Runtime resilience is mandatory in distributed frontend systems.

**Alternative rejected:** Global app crash on remote load error.

### D5 — Dev orchestration contract via Nx serve targets

**Decision:** Define fixed local ports and a documented startup pattern so shell can resolve remote entries predictably in development.

**Rationale:** Stable port mapping removes “works on my machine” federation failures.

**Alternative rejected:** Dynamic/random ports. This breaks static remote manifest assumptions during local development.

### D6 — Independent-deploy build graph policy

**Decision:** Do not introduce host `implicitDependencies` on remotes for this change.

**Rationale:** Host and remotes must remain independently releasable; adding build-graph coupling belongs to faster-builds mode, not independent deploy mode.

**Alternative rejected:** Host implicit dependencies to all remotes. This improves coordinated builds but undermines independent deployment boundaries.

### D7 — Environment-based remote resolution

**Decision:** Use project-name remotes for local development and explicit URL tuple remotes for production/staging via environment-based configuration.

**Rationale:** Local DX stays simple while deployments can independently point each remote to its real runtime location.

**Alternative rejected:** Hardcoded production URLs in a single static config. This breaks local workflows and complicates multi-environment promotion.

## Risks / Trade-offs

- Version drift between host and remotes for independently owned libraries → Share only React runtime libraries by default and require compatibility checks before promoting shared-library changes.
- Remote contract drift (`./Module` renamed/removed) → Add explicit runtime and lint/test checks for required expose keys.
- Developer confusion around startup order → Document one canonical Nx command sequence in tasks and README updates.
- Shell route map becoming a bottleneck → Keep shell ownership to route registration only; feature internals remain in remotes.

## Migration Plan

1. Add federation config for shell host and each remote using the agreed expose/remote names and core-only sharing policy.
2. Add local remotes by project name for development and environment-based URL tuples for deployable environments.
3. Add route map in shell for `catalog`, `cart`, `checkout`, `account` remote mounts.
4. Add route-level fallback/error handling for remote load failures.
5. Validate composition locally with all apps served and each remote reachable from shell.
6. Validate independent deploy behavior by pointing one remote to a different deployed version and verifying shell resilience.

**Rollback strategy:** Remove federation wiring and route-level remote mounting changes; shell reverts to local-only routes while remotes run standalone.

## Open Questions

- Should environment-specific remote URL mapping be provided via static environment variables or a fetched runtime manifest?
- Do we need automated compatibility gates for remote contract versions in CI before production promotion?
