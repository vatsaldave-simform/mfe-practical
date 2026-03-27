import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Map federation remote module specifiers to local stubs for Vitest.
    // This satisfies Vite's import-analysis pass; vi.mock() further controls
    // what each stub exports at runtime.
    alias: {
      'catalog/Module': resolve(__dirname, 'src/__mocks__/catalog-remote.tsx'),
      'cart/Module': resolve(__dirname, 'src/__mocks__/cart-remote.tsx'),
      'checkout/Module': resolve(
        __dirname,
        'src/__mocks__/checkout-remote.tsx',
      ),
      'account/Module': resolve(__dirname, 'src/__mocks__/account-remote.tsx'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['apps/shell/src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/apps/shell',
    },
  },
});
