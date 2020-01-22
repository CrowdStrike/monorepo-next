'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const buildDepGraph = require('../src/build-dep-graph');
const buildChangeGraph = require('../src/build-change-graph');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const exec = promisify(require('child_process').exec);
const sinon = require('sinon');
const { matchPath } = require('./helpers/matchers');
const { gitInit } = require('git-fixtures');

describe(buildChangeGraph, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await tmpDir();

    await gitInit({ cwd: tmpPath });
    await exec('git commit --allow-empty -m "first"', { cwd: tmpPath });
  });

  it('bumps in-range versions', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'dependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
      },
      'package.json': stringifyJson({
        'private': true,
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });
    await exec('git tag @scope/package-b@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
      },
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    expect(packagesWithChanges).to.match(sinon.match([
      {
        changedFiles: [
          'packages/package-a/package.json',
        ],
        dag: {
          branch: [],
          cwd: matchPath('/packages/package-a'),
          dependents: [
            {
              branch: [
                '@scope/package-a',
              ],
              cwd: matchPath('/packages/package-b'),
              dependencyRange: '^1.0.0',
              dependencyType: 'dependencies',
              dependents: [],
              isCycle: false,
              isPackage: true,
              packageName: '@scope/package-b',
              version: '1.0.0',
            },
          ],
          isCycle: false,
          isPackage: true,
          packageName: '@scope/package-a',
          version: '1.0.0',
        },
      },
      {
        changedFiles: [],
        dag: {
          branch: [
            '@scope/package-a',
          ],
          cwd: matchPath('/packages/package-b'),
          dependencyRange: '^1.0.0',
          dependencyType: 'dependencies',
          dependents: [],
          isCycle: false,
          isPackage: true,
          packageName: '@scope/package-b',
          version: '1.0.0',
        },
      },
    ]));
  });
});
