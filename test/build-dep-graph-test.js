'use strict';

const { describe, it, setUpSinon } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const path = require('path');
const buildDepGraph = require('../src/build-dep-graph');
const { createTmpDir } = require('./helpers/tmp');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const { matchPath } = require('./helpers/matchers');

let cwd = path.resolve(__dirname, './fixtures/workspace');

describe(buildDepGraph, function() {
  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpSinon();

  let tmpPath;

  beforeEach(async function() {
    tmpPath = await createTmpDir();
  });

  it('works', async function() {
    let workspaceMeta = await buildDepGraph({ workspaceCwd: cwd });

    expect(workspaceMeta).to.match(this.match({
      cwd: matchPath('/workspace'),
      packageName: 'Workspace Root',
      version: undefined,
      isPrivate: true,
      packagesGlobs: [
        'packages/*',
      ],
      dependencies: {},
      devDependencies: {
        '@scope/package-a': '^1.0.0',
      },
      optionalDependencies: {},
      packages: {
        '@scope/package-a': {
          cwd: matchPath('/workspace/packages/package-a'),
          packageName: '@scope/package-a',
          version: '1.0.0',
          isPrivate: undefined,
          dependencies: {},
          devDependencies: {
            '@scope/package-b': '^2.0.0',
          },
          optionalDependencies: {},
        },
        '@scope/package-b': {
          cwd: matchPath('/workspace/packages/package-b'),
          packageName: '@scope/package-b',
          version: '2.0.0',
          isPrivate: undefined,
          dependencies: {
            '@scope/package-a': '^1.0.0',
          },
          devDependencies: {},
          optionalDependencies: {},
        },
        '@scope/package-c': {
          cwd: matchPath('/workspace/packages/package-c'),
          packageName: '@scope/package-c',
          version: '3.0.0',
          isPrivate: undefined,
          dependencies: {
            '@scope/package-b': '^2.0.0',
          },
          devDependencies: {},
          optionalDependencies: {
            '@scope/package-a': '^1.0.0',
          },
        },
      },
    }));
  });

  it('can include unrecognized and out of range deps', async function() {
    let workspaceMeta = await buildDepGraph({
      workspaceCwd: cwd,
      shouldPruneDeps: false,
    });

    expect(workspaceMeta).to.match(this.match({
      devDependencies: {
        '@scope/package-b': '^1.0.0',
      },
      packages: {
        '@scope/package-c': {
          devDependencies: {
            '@scope/package-d': '^1.0.0',
          },
        },
      },
    }));
  });

  it('ignores empty folders', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {},
      },
      'package.json': stringifyJson({
        'private': true,
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    expect(workspaceMeta).to.deep.equal({
      cwd: tmpPath,
      packageName: 'Workspace Root',
      version: undefined,
      isPrivate: true,
      packagesGlobs: [
        'packages/*',
      ],
      dependencies: {},
      devDependencies: {},
      optionalDependencies: {},
      packages: {},
    });
  });
});
