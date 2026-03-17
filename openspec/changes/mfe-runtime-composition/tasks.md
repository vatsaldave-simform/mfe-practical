## 1. Federation Dependencies & Baseline

- [x] 1.1 Add and lock required Module Federation v2 dependencies for Rspack host/remote composition.
- [x] 1.2 Verify all frontend apps (`shell`, `catalog`, `cart`, `checkout`, `account`) can build with the federation plugin installed.

## 2. Host/Remote Federation Configuration

- [x] 2.1 Configure `apps/shell` as the host with remotes: `catalog`, `cart`, `checkout`, `account`.
- [x] 2.2 Configure each remote app to expose exactly one entry key: `./Module`.
- [x] 2.3 Define and align stable remote names and development entry URLs across host and remotes.

## 3. Core-Only Shared Runtime Contract

- [ ] 3.1 Configure only `react` and `react-dom` as shared singletons in shell.
- [ ] 3.2 Configure the same core singleton set in every remote and verify settings are consistent.
- [ ] 3.3 Ensure `@apollo/client`, `graphql`, and other non-core dependencies are not shared by default.

## 4. Shell Route Composition & Failure Isolation

- [ ] 4.1 Implement shell route mapping that mounts each remote `./Module` at its assigned route segment.
- [ ] 4.2 Add per-route fallback UI for remote loading states.
- [ ] 4.3 Add per-route remote error boundary behavior so one remote failure does not break unrelated routes.

## 5. Local Development Orchestration

- [ ] 5.1 Define deterministic local ports for shell and all remotes in serve configuration.
- [ ] 5.2 Add documented Nx command flow to run all frontend apps together for composition testing.
- [ ] 5.3 Validate that shell resolves remotes without manual URL edits in a fresh local session.

## 6. Independent Deploy Resolution

- [ ] 6.1 Configure environment-based remote URL mapping for staging/production while preserving project-name remotes for local development.
- [ ] 6.2 Validate one-remote-at-a-time deploy simulation by pointing shell to a newer compatible remote build.
- [ ] 6.3 Confirm no host `implicitDependencies` are introduced that force coupled remote rebuilds for independent deploy mode.

## 7. Verification & Quality Gates

- [ ] 7.1 Add/adjust tests for remote route mount and remote-failure fallback behavior.
- [ ] 7.2 Validate lint/typecheck/test for affected projects via `nx affected -t lint,test` and `nx affected -t build`.
- [ ] 7.3 Update change artifacts if implementation discovers contract deltas before `/opsx:apply` completion.
