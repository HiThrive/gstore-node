'use strict';

const globals = require('globals');
const eslintJs = require('@eslint/js');
const tseslint = require('typescript-eslint');
const pluginImport = require('eslint-plugin-import');
const pluginJest = require('eslint-plugin-jest');
const pluginPrettier = require('eslint-plugin-prettier');
const configPrettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    ignores: ['lib/**', 'node_modules/**', 'coverage/**', 'scripts/**'],
  },
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  configPrettier,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      import: pluginImport,
      jest: pluginJest,
      prettier: pluginPrettier,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'import/prefer-default-export': 'off',
      'prefer-rest-params': 'off',
      'prefer-spread': 'off',
      'no-restricted-globals': 'off',
      'no-underscore-dangle': 'off',
      'no-param-reassign': 'off',
      'no-use-before-define': 'off',
      'import/extensions': ['error', 'never', { json: 'always' }],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/__tests__/**/*.ts',
            '**/*.test.ts',
            '**/*.spec.ts',
            'eslint.config.js',
            'jest.config*.js',
          ],
        },
      ],
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
    },
  },
  {
    files: ['**/*.js', 'eslint.config.js', 'jest.config*.js', '.prettierrc.js'],
    languageOptions: {
      sourceType: 'script',
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
);
