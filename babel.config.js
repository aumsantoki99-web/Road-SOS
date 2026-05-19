module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Module path aliases — must match tsconfig.json paths
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@hooks': './src/hooks',
            '@context': './src/context',
            '@theme': './src/theme',
            '@services': './src/services',
            '@storage': './src/storage',
            '@utils': './src/utils',
            '@mock': './src/mock',
            '@constants': './src/constants',
            '@types': './src/types',
            '@assets': './src/assets',
          },
        },
      ],
      // Required for react-native-reanimated — must be last
      'react-native-reanimated/plugin',
    ],
  };
};
