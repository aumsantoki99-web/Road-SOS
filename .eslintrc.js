module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  plugins: [
    'react',
    'react-hooks',
    'react-native',
    '@typescript-eslint',
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // React
    'react/prop-types': 'off', // TypeScript handles this
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/display-name': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Native
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'babel.config.js',
    'metro.config.js',
    '.expo/',
  ],
};
