/**
 * Unit tests for the environment-based remote URL resolver.
 *
 * Covers task 6.1 (environment-based remote URL mapping) and task 6.2
 * (one-remote-at-a-time override) which were implemented as part of the
 * independent deploy resolution section (section 6) of the
 * mfe-runtime-composition OpenSpec change.
 *
 * Design decisions exercised:
 *   D5 – project-name remotes in development
 *   D6 – no build-graph coupling; each remote URL is independently settable
 *   D7 – URL tuple remotes in staging / production via env variables
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Dynamically re-require the module inside each test so process.env changes
// are visible (Node caches CJS modules; we must delete the cache key to get
// a fresh evaluation with the current env state).
function loadConfig() {
  const modulePath = require.resolve('./remote-url-config');
  delete require.cache[modulePath];
  return require('./remote-url-config') as {
    LOCAL_REMOTE_ENTRY_URLS: Record<string, string>;
    DEPLOY_ENVIRONMENTS: Set<string>;
    getDeployTarget: () => string;
    getRemotes: () => string[] | [string, string][];
  };
}

const REMOTE_NAMES = ['catalog', 'cart', 'checkout', 'account'];
const DEFAULT_URLS: Record<string, string> = {
  catalog: 'http://localhost:4201/remoteEntry.js',
  cart: 'http://localhost:4202/remoteEntry.js',
  checkout: 'http://localhost:4203/remoteEntry.js',
  account: 'http://localhost:4204/remoteEntry.js',
};

// Snapshot of env vars touched across tests; restored after each test.
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {
    MFE_DEPLOY_TARGET: process.env['MFE_DEPLOY_TARGET'],
    NODE_ENV: process.env['NODE_ENV'],
    MFE_REMOTE_CATALOG_URL: process.env['MFE_REMOTE_CATALOG_URL'],
    MFE_REMOTE_CART_URL: process.env['MFE_REMOTE_CART_URL'],
    MFE_REMOTE_CHECKOUT_URL: process.env['MFE_REMOTE_CHECKOUT_URL'],
    MFE_REMOTE_ACCOUNT_URL: process.env['MFE_REMOTE_ACCOUNT_URL'],
  };
});

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

// ── getDeployTarget ────────────────────────────────────────────────────────

describe('getDeployTarget()', () => {
  it('returns MFE_DEPLOY_TARGET when set', () => {
    process.env['MFE_DEPLOY_TARGET'] = 'staging';
    const { getDeployTarget } = loadConfig();
    expect(getDeployTarget()).toBe('staging');
  });

  it('falls back to NODE_ENV when MFE_DEPLOY_TARGET is absent', () => {
    delete process.env['MFE_DEPLOY_TARGET'];
    process.env['NODE_ENV'] = 'test';
    const { getDeployTarget } = loadConfig();
    expect(getDeployTarget()).toBe('test');
  });

  it('falls back to "development" when both env vars are absent', () => {
    delete process.env['MFE_DEPLOY_TARGET'];
    delete process.env['NODE_ENV'];
    const { getDeployTarget } = loadConfig();
    expect(getDeployTarget()).toBe('development');
  });
});

// ── getRemotes – development mode ─────────────────────────────────────────

describe('getRemotes() – development mode (project-name remotes)', () => {
  it('returns project-name strings when deploy target is "development"', () => {
    process.env['MFE_DEPLOY_TARGET'] = 'development';
    const { getRemotes } = loadConfig();
    expect(getRemotes()).toEqual(REMOTE_NAMES);
  });

  it('returns project-name strings when no deploy target env var is set (default)', () => {
    delete process.env['MFE_DEPLOY_TARGET'];
    delete process.env['NODE_ENV'];
    const { getRemotes } = loadConfig();
    expect(getRemotes()).toEqual(REMOTE_NAMES);
  });

  it('returns plain strings (not tuples) in development', () => {
    process.env['MFE_DEPLOY_TARGET'] = 'development';
    const { getRemotes } = loadConfig();
    const remotes = getRemotes() as string[];
    for (const entry of remotes) {
      expect(typeof entry).toBe('string');
    }
  });
});

// ── getRemotes – staging/production mode ──────────────────────────────────

describe('getRemotes() – staging / production mode (URL tuple remotes)', () => {
  it.each(['staging', 'production'])(
    'returns [name, url] tuples when deploy target is "%s"',
    (target) => {
      process.env['MFE_DEPLOY_TARGET'] = target;
      const { getRemotes } = loadConfig();
      const remotes = getRemotes() as [string, string][];

      expect(remotes).toHaveLength(4);
      for (const [name, url] of remotes) {
        expect(typeof name).toBe('string');
        expect(typeof url).toBe('string');
        expect(REMOTE_NAMES).toContain(name);
      }
    },
  );

  it('uses default localhost entry URLs when no override env vars are set', () => {
    process.env['MFE_DEPLOY_TARGET'] = 'production';
    const { getRemotes } = loadConfig();
    const remotes = getRemotes() as [string, string][];

    for (const [name, url] of remotes) {
      expect(url).toBe(DEFAULT_URLS[name]);
    }
  });

  it('tuples preserve expected order: catalog, cart, checkout, account', () => {
    process.env['MFE_DEPLOY_TARGET'] = 'production';
    const { getRemotes } = loadConfig();
    const names = (getRemotes() as [string, string][]).map(([n]) => n);
    expect(names).toEqual(REMOTE_NAMES);
  });
});

// ── getRemotes – single-remote override (task 6.2) ────────────────────────

describe('getRemotes() – independent per-remote URL override (task 6.2)', () => {
  it('overrides only catalog when MFE_REMOTE_CATALOG_URL is set', () => {
    const canaryUrl = 'https://cdn.example.com/catalog/canary/remoteEntry.js';
    process.env['MFE_DEPLOY_TARGET'] = 'production';
    process.env['MFE_REMOTE_CATALOG_URL'] = canaryUrl;
    const { getRemotes } = loadConfig();
    const remotes = Object.fromEntries(getRemotes() as [string, string][]);

    expect(remotes['catalog']).toBe(canaryUrl);
    expect(remotes['cart']).toBe(DEFAULT_URLS['cart']);
    expect(remotes['checkout']).toBe(DEFAULT_URLS['checkout']);
    expect(remotes['account']).toBe(DEFAULT_URLS['account']);
  });

  it('allows all four remotes to be independently overridden', () => {
    process.env['MFE_DEPLOY_TARGET'] = 'production';
    process.env['MFE_REMOTE_CATALOG_URL'] =
      'https://cdn.example.com/catalog/remoteEntry.js';
    process.env['MFE_REMOTE_CART_URL'] =
      'https://cdn.example.com/cart/remoteEntry.js';
    process.env['MFE_REMOTE_CHECKOUT_URL'] =
      'https://cdn.example.com/checkout/remoteEntry.js';
    process.env['MFE_REMOTE_ACCOUNT_URL'] =
      'https://cdn.example.com/account/remoteEntry.js';

    const { getRemotes } = loadConfig();
    const remotes = Object.fromEntries(getRemotes() as [string, string][]);

    expect(remotes['catalog']).toBe(
      'https://cdn.example.com/catalog/remoteEntry.js',
    );
    expect(remotes['cart']).toBe('https://cdn.example.com/cart/remoteEntry.js');
    expect(remotes['checkout']).toBe(
      'https://cdn.example.com/checkout/remoteEntry.js',
    );
    expect(remotes['account']).toBe(
      'https://cdn.example.com/account/remoteEntry.js',
    );
  });

  it('URL override env vars have no effect in development mode (project-name remotes are returned)', () => {
    process.env['MFE_DEPLOY_TARGET'] = 'development';
    process.env['MFE_REMOTE_CATALOG_URL'] =
      'https://cdn.example.com/catalog/remoteEntry.js';
    const { getRemotes } = loadConfig();

    // In development the result is plain strings, not tuples.
    expect(getRemotes()).toEqual(REMOTE_NAMES);
  });
});

// ── LOCAL_REMOTE_ENTRY_URLS contract ──────────────────────────────────────

describe('LOCAL_REMOTE_ENTRY_URLS', () => {
  it('defines exactly the four expected remotes', () => {
    const { LOCAL_REMOTE_ENTRY_URLS } = loadConfig();
    expect(Object.keys(LOCAL_REMOTE_ENTRY_URLS)).toEqual(REMOTE_NAMES);
  });

  it('all default entry URLs end with /remoteEntry.js', () => {
    const { LOCAL_REMOTE_ENTRY_URLS } = loadConfig();
    for (const url of Object.values(LOCAL_REMOTE_ENTRY_URLS)) {
      expect(url).toMatch(/\/remoteEntry\.js$/);
    }
  });
});
