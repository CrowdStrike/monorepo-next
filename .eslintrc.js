'use strict';

module.exports = {
  root: true,
  extends: [
    'crowdstrike-node',
  ],
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
        'mocha/no-hooks-for-single-case': 'off',
      },
    },
  ],
};
