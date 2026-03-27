## Why

The workspace foundation is complete, but the system cannot operate as microfrontends yet because shell/remote composition is not configured. This change establishes the runtime integration contract so feature work can proceed without ad-hoc federation decisions in each app.

## What Changes

- Configure Module Federation v2 runtime composition between `apps/shell` (host) and `apps/catalog`, `apps/cart`, `apps/checkout`, `apps/account` (remotes)
- Define remote exposure contract: each remote exposes a single `./Module` entry consumed by shell routes
- Define and enforce shared singleton strategy for `react`, `react-dom`, `@apollo/client`, and `graphql`
- Define shell-side remote loading behavior, including fallback UI and failure handling when a remote is unavailable
- Define local development orchestration for running shell + remotes together with predictable ports and startup commands
- Add verification scenarios for successful remote load, remote failure isolation, and route-to-remote mapping consistency

## Capabilities

### New Capabilities

- `mfe-runtime-composition`: Runtime composition contract for host/remotes, shared dependencies, route mounting, and failure behavior in the MFE architecture.

### Modified Capabilities

- (none)

## Impact

- Affected projects: `apps/shell`, `apps/catalog`, `apps/cart`, `apps/checkout`, `apps/account`, and related root task/runtime config
- Introduces runtime coupling contracts between host and remotes (exposes/remotes/shared/ports) that future feature proposals must follow
- No business-domain API or schema behavior changes in this proposal; backend capabilities remain unchanged
- Reduces delivery risk by making runtime integration explicit before implementing domain features in separate remotes
