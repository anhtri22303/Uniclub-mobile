const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Fix for React Native web module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native/Libraries/Utilities/Platform': require.resolve('react-native-web/dist/exports/Platform'),
};

module.exports = withNativeWind(config, { input: './global.css' })