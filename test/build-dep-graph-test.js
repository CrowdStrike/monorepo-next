'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const path = require('path');
const buildDepGraph = require('../src/build-dep-graph');
const { createTmpDir } = require('./helpers/tmp');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const sinon = require('sinon');
const { matchPath } = require('./helpers/matchers');

let cwd = path.resolve(__dirname, './fixtures/workspace');

describe(buildDepGraph, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await createTmpDir();
  });

  it('works', async function() {
    let workspaceMeta = await buildDepGraph(cwd);

    expect(workspaceMeta).to.match(sinon.match({
      cwd: matchPath('/workspace'),
      packageName: 'Workspace Root',
      version: undefined,
      isPrivate: true,
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

    let workspaceMeta = await buildDepGraph(tmpPath);

    expect(workspaceMeta).to.deep.equal({
      cwd: tmpPath,
      packageName: 'Workspace Root',
      version: undefined,
      isPrivate: true,
      dependencies: {},
      devDependencies: {},
      optionalDependencies: {},
      packages: {},
    });
  });
});
