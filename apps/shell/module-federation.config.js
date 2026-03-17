module.exports = {
  name: '@mfe-practical/shell',
  remotes: [
    ['catalog', 'http://localhost:4201/remoteEntry.js'],
    ['cart', 'http://localhost:4202/remoteEntry.js'],
    ['checkout', 'http://localhost:4203/remoteEntry.js'],
    ['account', 'http://localhost:4204/remoteEntry.js'],
  ],
};
