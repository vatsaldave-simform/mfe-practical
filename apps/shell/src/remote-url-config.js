'use strict';
/**
 * remote-url-config.js
 *
 * Environment-based remote URL resolution for shell Module Federation config.
 * Satisfies task 6.1 (D7 in design: environment-based remote resolution).
 *
 * Behaviour:
 *   - Development (default): returns project-name strings so Nx/Rspack
 *     resolves remotes by project name and the dev server handles routing.
 *   - staging | production: returns [name, url] tuples.  Each remote URL
 *     defaults to the deterministic local entry URL but can be overridden
 *     per-remote via MFE_REMOTE_<NAME>_URL so a single remote can be
 *     promoted independently (task 6.2, D6).
 *
 * Exported for unit-testing; consumed by module-federation.config.js via require.
 */

/** Fallback entry URLs used when no env override is present for a remote. */
const LOCAL_REMOTE_ENTRY_URLS = {
  catalog: 'http://localhost:4201/remoteEntry.js',
  cart: 'http://localhost:4202/remoteEntry.js',
  checkout: 'http://localhost:4203/remoteEntry.js',
  account: 'http://localhost:4204/remoteEntry.js',
};

/** Environment names that trigger URL-based remote resolution. */
const DEPLOY_ENVIRONMENTS = new Set(['staging', 'production']);

/**
 * Returns the current deploy target using the priority order:
 *   MFE_DEPLOY_TARGET → NODE_ENV → 'development'
 */
function getDeployTarget() {
  return (
    process.env['MFE_DEPLOY_TARGET'] ?? process.env['NODE_ENV'] ?? 'development'
  );
}

/**
 * Returns the Module Federation `remotes` value appropriate for the current
 * deploy target.
 *
 * @returns {string[] | [string, string][]}
 *   - string[] in development – Nx resolves by project name
 *   - [name, url][] in staging/production – explicit per-remote entry URLs
 */
function getRemotes() {
  const deployTarget = getDeployTarget();

  if (!DEPLOY_ENVIRONMENTS.has(deployTarget)) {
    // Development: let Nx Module Federation handle project-name remotes.
    return ['catalog', 'cart', 'checkout', 'account'];
  }

  // Staging / production: resolve each remote to an explicit URL.
  // Each remote can be independently overridden via its env variable, enabling
  // one-remote-at-a-time deploys without rebuilding the host or other remotes.
  return Object.entries(LOCAL_REMOTE_ENTRY_URLS).map(
    ([remoteName, localUrl]) => {
      const envVarName = `MFE_REMOTE_${remoteName.toUpperCase()}_URL`;
      const remoteEntryUrl = process.env[envVarName] ?? localUrl;
      return [remoteName, remoteEntryUrl];
    },
  );
}

module.exports = {
  LOCAL_REMOTE_ENTRY_URLS,
  DEPLOY_ENVIRONMENTS,
  getDeployTarget,
  getRemotes,
};
