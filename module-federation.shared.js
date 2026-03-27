const CORE_SINGLETONS = new Set(['react', 'react-dom']);

function shareCoreSingletons(libraryName, sharedConfig) {
  // Keep the runtime contract intentionally small so libraries like
  // @apollo/client, graphql, and future non-core dependencies stay isolated.
  if (!CORE_SINGLETONS.has(libraryName)) {
    return false;
  }

  return {
    ...sharedConfig,
    singleton: true,
  };
}

module.exports = {
  CORE_SINGLETONS,
  shareCoreSingletons,
};
