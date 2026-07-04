const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Corrige "Unable to resolve X.mjs" (necessário para bibliotecas como lucide-react-native)
config.resolver.sourceExts.push("mjs");

module.exports = withNativeWind(config, { input: './global.css' });