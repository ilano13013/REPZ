// Configuration Metro par défaut d'Expo.
// Fichier explicite : certains environnements (conteneurs, Codespaces) ne
// résolvent pas correctement la configuration implicite au démarrage du bundler.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
