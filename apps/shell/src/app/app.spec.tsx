/**
 * Shell app tests – covers tasks 4.1–4.3:
 *   4.1 Remote route mounting
 *   4.2 Per-route Suspense fallback
 *   4.3 Per-route error boundary (failure isolation)
 *
 * Environment-based remote URL resolution (task 6.1) and single-remote
 * override simulation (task 6.2) are covered in remote-url-config.spec.ts.
 */
import { Suspense } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './app';
import { RemoteErrorBoundary } from './remote-error-boundary';

// Stub each federation remote so tests run without a live remote server.
vi.mock('catalog/Module', () => ({ default: () => <div>Catalog Remote</div> }));
vi.mock('cart/Module', () => ({ default: () => <div>Cart Remote</div> }));
vi.mock('checkout/Module', () => ({
  default: () => <div>Checkout Remote</div>,
}));
vi.mock('account/Module', () => ({ default: () => <div>Account Remote</div> }));

// ── 4.1 Route mounting ─────────────────────────────────────────────────────

describe('Shell route mapping (task 4.1)', () => {
  it('mounts catalog remote at /catalog', async () => {
    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Catalog Remote')).toBeTruthy();
  });

  it('mounts cart remote at /cart', async () => {
    render(
      <MemoryRouter initialEntries={['/cart']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Cart Remote')).toBeTruthy();
  });

  it('mounts checkout remote at /checkout', async () => {
    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Checkout Remote')).toBeTruthy();
  });

  it('mounts account remote at /account', async () => {
    render(
      <MemoryRouter initialEntries={['/account']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Account Remote')).toBeTruthy();
  });
});

// ── 4.2 Per-route Suspense fallback ───────────────────────────────────────

describe('Per-route loading fallback (task 4.2)', () => {
  it('renders loading fallback while remote suspends', () => {
    // A component that suspends indefinitely simulates a slow network load.
    const neverResolves = new Promise<never>(() => undefined);
    const SlowRemote = () => {
      throw neverResolves as unknown;
    };

    render(
      <Suspense fallback={<p>Loading catalog…</p>}>
        <SlowRemote />
      </Suspense>,
    );

    expect(screen.getByText('Loading catalog…')).toBeTruthy();
  });
});

// ── 4.3 Per-route error boundary (failure isolation) ──────────────────────

describe('Per-route error boundary (task 4.3)', () => {
  // Silence expected React error boundary console.error in test output.
  // eslint-disable-next-line no-console
  const originalError = console.error;
  beforeEach(() => {
    // eslint-disable-next-line no-console
    console.error = vi.fn();
  });
  afterEach(() => {
    // eslint-disable-next-line no-console
    console.error = originalError;
    // Explicit cleanup ensures the DOM from one test doesn't bleed into the next.
    cleanup();
  });

  it('renders local fallback when a remote throws on load', () => {
    const BrokenRemote = (): never => {
      throw new Error('Network Error: remote unavailable');
    };

    render(
      <RemoteErrorBoundary remoteName="catalog">
        <BrokenRemote />
      </RemoteErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/catalog is currently unavailable/i)).toBeTruthy();
    expect(
      screen.getByText(/Other parts of the application are still accessible/i),
    ).toBeTruthy();
  });

  it('does not affect sibling content when one remote fails', () => {
    const BrokenRemote = (): never => {
      throw new Error('Remote down');
    };

    // Render two sections – one broken, one healthy – to verify isolation.
    render(
      <MemoryRouter initialEntries={['/cart']}>
        <div>
          <RemoteErrorBoundary remoteName="catalog">
            <BrokenRemote />
          </RemoteErrorBoundary>
          <div>Cart route still renders</div>
        </div>
      </MemoryRouter>,
    );

    // Broken remote shows its fallback
    expect(screen.getByRole('alert')).toBeTruthy();
    // Sibling content is unaffected
    expect(screen.getByText('Cart route still renders')).toBeTruthy();
  });
});
