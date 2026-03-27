/**
 * Stub for federation remote module imports in test environments.
 *
 * Vite's import-analysis pass requires a resolvable path for each `import()`
 * expression. This file satisfies that requirement.
 *
 * Individual tests override the export via `vi.mock('<remote>/Module', ...)`
 * to render whatever the test needs without a live remote server.
 */

export default function FederationRemoteStub() {
  return <div data-testid="federation-remote-stub">Remote Stub</div>;
}
