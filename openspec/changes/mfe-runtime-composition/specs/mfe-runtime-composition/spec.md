## ADDED Requirements

### Requirement: Shell SHALL compose all frontend remotes at runtime

The system SHALL configure `apps/shell` as the Module Federation host and SHALL load `catalog`, `cart`, `checkout`, and `account` as runtime remotes.

#### Scenario: Shell resolves configured remotes

- **WHEN** shell starts in a development environment with all remotes running
- **THEN** shell resolves all configured remote entries and can mount remote modules by route

### Requirement: Each remote MUST expose exactly one public entry `./Module`

Each frontend remote (`catalog`, `cart`, `checkout`, `account`) MUST expose a single public federation entry named `./Module` used by shell for route mounting.

#### Scenario: Remote expose contract validation

- **WHEN** a remote federation configuration is inspected
- **THEN** exactly one public entry exists and its key is `./Module`

### Requirement: Only core UI runtime packages MUST be shared as singletons

Host and remotes MUST share `react` and `react-dom` as singletons in federation runtime configuration. Other packages, including `@apollo/client` and `graphql`, MUST NOT be shared by default.

#### Scenario: Core singleton dependency agreement

- **WHEN** host and remote federation shared settings are compared
- **THEN** `react` and `react-dom` are configured as shared singletons across all participating apps

#### Scenario: Non-core dependency isolation

- **WHEN** host and remote federation shared settings are compared
- **THEN** non-core libraries are not shared unless a deliberate exception is documented

### Requirement: Shell MUST isolate remote failures per route

Shell MUST provide route-level fallback behavior so that a failed remote load does not crash unrelated shell routes.

#### Scenario: One remote unavailable

- **WHEN** a user navigates to a route backed by a stopped or unreachable remote
- **THEN** shell renders a local fallback for that route and remains functional for other routes

### Requirement: Local development MUST use deterministic federation endpoints

The workspace SHALL define stable local ports and startup conventions for shell and each remote so runtime remote resolution is predictable.

#### Scenario: Deterministic local startup

- **WHEN** developers start shell and remotes using documented Nx serve commands
- **THEN** shell can resolve all remote endpoints without manual URL edits or port discovery

### Requirement: Production and staging remote resolution MUST be environment-based

The system MUST support environment-based remote URL resolution so each remote can be deployed and promoted independently.

#### Scenario: Environment-specific remote mapping

- **WHEN** a production or staging build is created
- **THEN** remotes resolve to environment-specific URLs rather than local project-name remotes

### Requirement: Host and remotes MUST remain independently deployable

The workspace MUST avoid host-to-remote build graph coupling that forces coordinated releases for every remote change.

#### Scenario: Independent release cadence preserved

- **WHEN** one remote releases a compatible change
- **THEN** that remote can be deployed without requiring host and all other remotes to be rebuilt and released together
