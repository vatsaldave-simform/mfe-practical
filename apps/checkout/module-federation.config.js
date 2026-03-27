const { shareCoreSingletons } = require('../../module-federation.shared');

module.exports = {
  name: '@mfe-practical/checkout',
  exposes: {
    './Module': './src/remote-entry.ts',
  },
  shared: shareCoreSingletons,
};
