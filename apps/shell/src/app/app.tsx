/**
 * Shell application root.
 *
 * Implements tasks 4.1 – 4.3 of the mfe-runtime-composition change:
 *   4.1 Route mapping – each remote `./Module` is mounted at its assigned
 *       route segment (/catalog, /cart, /checkout, /account).
 *   4.2 Per-route fallback UI – a `<Suspense>` boundary wraps every lazy
 *       remote import so the loading state is isolated to that route.
 *   4.3 Per-route error boundary – `<RemoteErrorBoundary>` surrounds each
 *       remote so a failed remote load never crashes unrelated routes.
 *
 * Design decisions followed:
 *   D1 – shell is the only host; navigation lives here.
 *   D2 – remotes are consumed through the single `./Module` expose key.
 *   D4 – failure isolation per route, not global.
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { RemoteErrorBoundary } from './remote-error-boundary';

// ── Lazy remote imports ────────────────────────────────────────────────────
// Each `./Module` maps to the remote's `remote-entry.ts` default export.
// Rspack + Module-Federation resolves these at runtime from the remotes
// declared in apps/shell/module-federation.config.js.

// @ts-expect-error – federation dynamic imports are resolved at runtime
const CatalogModule = lazy(() => import('catalog/Module'));

// @ts-expect-error – federation dynamic imports are resolved at runtime
const CartModule = lazy(() => import('cart/Module'));

// @ts-expect-error – federation dynamic imports are resolved at runtime
const CheckoutModule = lazy(() => import('checkout/Module'));

// @ts-expect-error – federation dynamic imports are resolved at runtime
const AccountModule = lazy(() => import('account/Module'));

// ── Per-route loading fallback (task 4.2) ─────────────────────────────────

function RemoteLoadingFallback({ name }: { readonly name: string }) {
  return (
    <div aria-busy="true" aria-label={`Loading ${name}`}>
      <p>Loading {name}…</p>
    </div>
  );
}

// ── Route map (task 4.1) ───────────────────────────────────────────────────

/** Wraps a remote component with error boundary (4.3) + suspense fallback (4.2). */
function RemoteRoute({
  name,
  Component,
}: {
  readonly name: string;
  readonly Component: React.ComponentType;
}) {
  return (
    <RemoteErrorBoundary remoteName={name}>
      <Suspense fallback={<RemoteLoadingFallback name={name} />}>
        <Component />
      </Suspense>
    </RemoteErrorBoundary>
  );
}

/**
 * Route declarations without a router provider.
 * Exported separately so tests can wrap with `<MemoryRouter>` to avoid a
 * nested-router conflict with the `<BrowserRouter>` in `<App>`.
 */
export function AppRoutes() {
  return (
    <>
      <nav aria-label="Main navigation">
        <Link to="/catalog">Catalog</Link>
        {' | '}
        <Link to="/cart">Cart</Link>
        {' | '}
        <Link to="/checkout">Checkout</Link>
        {' | '}
        <Link to="/account">Account</Link>
      </nav>

      <main>
        <Routes>
          {/* Redirect root to catalog as the default landing route */}
          <Route path="/" element={<Navigate to="/catalog" replace />} />

          {/* 4.1 Remote route mounting – one route per remote ./Module */}
          <Route
            path="/catalog/*"
            element={<RemoteRoute name="catalog" Component={CatalogModule} />}
          />
          <Route
            path="/cart/*"
            element={<RemoteRoute name="cart" Component={CartModule} />}
          />
          <Route
            path="/checkout/*"
            element={<RemoteRoute name="checkout" Component={CheckoutModule} />}
          />
          <Route
            path="/account/*"
            element={<RemoteRoute name="account" Component={AccountModule} />}
          />
        </Routes>
      </main>
    </>
  );
}

/** Production entry point – wraps AppRoutes with BrowserRouter. */
export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
