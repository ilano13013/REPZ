module.exports = function (api) {
  api.cache(true);
  return {
    // Depuis le SDK 52, babel-preset-expo ajoute automatiquement le plugin
    // react-native-reanimated lorsque le paquet est installé : il ne faut plus
    // le déclarer manuellement (double déclaration = erreur de compilation).
    presets: ['babel-preset-expo'],
  };
};
