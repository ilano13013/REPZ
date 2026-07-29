// Configuration Metro.
//
// Ajoute la prise en charge de expo-sqlite sur le web : le moteur SQLite y est
// compilé en WebAssembly, ce qui impose deux réglages :
//   1. reconnaître les fichiers .wasm comme des assets ;
//   2. servir les en-têtes COOP/COEP, requis par SharedArrayBuffer.
// Sans cela, le web échoue avec « Cannot find native module 'ExpoSQLite' ».
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = config;
