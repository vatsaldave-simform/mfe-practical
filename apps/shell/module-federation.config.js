const { shareCoreSingletons } = require('../../module-federation.shared');
// Environment-based remote URL resolution is extracted into a testable module
// (src/remote-url-config.js) following task 7.1 – keeping this build config
// as a thin wrapper so the logic can be unit-tested independently.
const { getRemotes } = require('./src/remote-url-config');

module.exports = {
  name: '@mfe-practical/shell',
  remotes: getRemotes(),
  shared: shareCoreSingletons,
};
