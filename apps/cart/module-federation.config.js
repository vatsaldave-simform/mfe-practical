const { shareCoreSingletons } = require('../../module-federation.shared');

module.exports = {
  name: '@mfe-practical/cart',
  exposes: {
    './Module': './src/remote-entry.ts',
  },
  shared: shareCoreSingletons,
};
