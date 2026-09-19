const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // allow files to be bundled
  config.resolver.assetExts.push('sqlite', 'jpg', 'pdf');

  return config;
})();