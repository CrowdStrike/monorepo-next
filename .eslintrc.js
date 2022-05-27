'use strict';

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: [
    'crowdstrike-node',
  ],
  rules: {
    'node/no-unsupported-features/es-syntax': ['error', {
      'ignores': [
        // remove once https://github.com/mysticatea/eslint-plugin-node/issues/250 is fixed
        'dynamicImport',
      ],
    }],
  },
  overrides: [
    {
      files: 'test/**/package.json',
      rules: {
        'json-files/require-engines': 'off',
        'json-files/require-license': 'off',
      },
    },
    {
      files: 'test/**/*-test.js',
      env: {
        mocha: true,
      },
      plugins: ['mocha'],
      extends: 'plugin:mocha/recommended',
      rules: {
        'mocha/no-exclusive-tests': 'error',
        'mocha/no-empty-description': 'off',
        'mocha/no-hooks-for-single-case': 'off',
      },
    },
  ],
};
