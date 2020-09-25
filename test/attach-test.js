'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const path = require('path');
const attach = require('../src/attach');
const { createTmpDir } = require('./helpers/tmp');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const { gitInit } = require('git-fixtures');

const defaultWorkspace = {
  'packages': {
    'package-a': {
      'package.json': stringifyJson({
        'name': '@scope/package-a',
        'version': '1.0.0',
        'devDependencies': {
          '@scope/package-b': '^2.0.0',
          '@scope/package-c': '^1.0.0',
        },
      }),
    },
    'package-b': {
      'package.json': stringifyJson({
        'name': '@scope/package-b',
        'version': '2.0.0',
        'dependencies': {
          '@scope/package-a': '^1.0.0',
        },
      }),
    },
    'package-c': {
      'package.json': stringifyJson({
        'name': '@scope/package-c',
        'version': '3.0.0',
        'dependencies': {
          '@scope/package-b': '^2.0.0',
        },
        'devDependencies': {
          '@scope/package-a': '^1.0.0',
        },
      }),
    },
  },
  'package.json': stringifyJson({
    'workspaces': [
      'packages/*',
    ],
    'devDependencies': {
      '@scope/package-a': '^1.0.0',
      '@scope/package-b': '^1.0.0',
    },
  }),
};

describe(attach, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await createTmpDir();

    await gitInit({ cwd: tmpPath });
  });

  it('package-a', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0-detached',
            'devDependencies': {
              '@scope/package-b': '^2.0.0 || 2.0.0-detached',
              '@scope/package-c': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '2.0.0-detached',
            'dependencies': {
              '@scope/package-a': '^1.0.0 || 1.0.0-detached',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '3.0.0',
            'dependencies': {
              '@scope/package-b': '^2.0.0',
            },
            'devDependencies': {
              '@scope/package-a': '^1.0.0 || 1.0.0-detached',
            },
          }),
        },
      },
      'package.json': stringifyJson({
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^1.0.0',
          '@scope/package-b': '^1.0.0',
        },
      }),
    });

    let cwd = path.resolve(tmpPath, './packages/package-a');

    await attach({ cwd });

    let workspace = fixturify.readSync(tmpPath, { ignore: ['.git'] });

    expect(workspace).to.deep.equal(defaultWorkspace);
  });

  it('package-b', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
            'devDependencies': {
              '@scope/package-b': '^2.0.0 || 2.0.0-detached',
              '@scope/package-c': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '2.0.0-detached',
            'dependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '3.0.0-detached',
            'dependencies': {
              '@scope/package-b': '^2.0.0 || 2.0.0-detached',
            },
            'devDependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
      },
      'package.json': stringifyJson({
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^1.0.0',
          '@scope/package-b': '^1.0.0',
        },
      }),
    });

    let cwd = path.resolve(tmpPath, './packages/package-b');

    await attach({ cwd });

    let workspace = fixturify.readSync(tmpPath, { ignore: ['.git'] });

    expect(workspace).to.deep.equal(defaultWorkspace);
  });

  it('package-c', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
            'devDependencies': {
              '@scope/package-b': '^2.0.0',
              '@scope/package-c': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '2.0.0',
            'dependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '3.0.0-detached',
            'dependencies': {
              '@scope/package-b': '^2.0.0',
            },
            'devDependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
      },
      'package.json': stringifyJson({
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^1.0.0',
          '@scope/package-b': '^1.0.0',
        },
      }),
    });

    let cwd = path.resolve(tmpPath, './packages/package-c');

    await attach({ cwd });

    let workspace = fixturify.readSync(tmpPath, { ignore: ['.git'] });

    expect(workspace).to.deep.equal(defaultWorkspace);
  });
});
