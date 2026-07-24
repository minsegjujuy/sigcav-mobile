const { getDefaultConfig } = require('expo/metro-config');

/**
 * @shopify/react-native-skia declara "react-native": "src/index.ts".
 * En Expo/Metro sobre Windows esto puede fallar resolviendo imports internos
 * (p.ej. "./imageFilters"). Priorizamos el build ya compilado (module/main)
 * y dejamos "react-native" como fallback.
 */
const config = getDefaultConfig(__dirname);

//config.resolver.resolverMainFields = ['module', 'main', 'react-native'];

module.exports = config;

