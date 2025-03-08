const { getDefaultConfig } = require("@expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Add CJS extension for compatibility
defaultConfig.resolver.assetExts.push("cjs");

// Optimize Metro Bundler configuration
defaultConfig.transformer.minifierConfig = {
  compress: {
    // Remove console statements and debugging
    drop_console: true,
    drop_debugger: true,
  },
};

// Enable parallel builds
defaultConfig.maxWorkers = 4;

// Optimize caching
defaultConfig.cacheStores = [];

module.exports = defaultConfig;
