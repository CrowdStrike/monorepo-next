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
const { gitInit } = require('git-fixtures');

describe(buildChangeGraph, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await tmpDir();

    await gitInit({ cwd: tmpPath });
    await exec('git commit --allow-empty -m "first"', { cwd: tmpPath });
  });

  it('tracks package changes', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
      },
      'package.json': stringifyJson({
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
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
          'packages/package-a/index.js',
        ],
        dag: sinon.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
  });

  it('ignores package without changes', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
      },
      'package.json': stringifyJson({
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });

    await exec('git commit --allow-empty -m "feat: foo"', { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    expect(packagesWithChanges).to.deep.equal([]);
  });

  it('tracks workspace with a version', async function() {
    fixturify.writeSync(tmpPath, {
      'package.json': stringifyJson({
        'name': 'workspace-root',
        'version': '1.0.0',
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag workspace-root@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'index.js': 'console.log()',
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    expect(packagesWithChanges).to.match(sinon.match([
      {
        changedFiles: [
          'index.js',
        ],
        dag: sinon.match({
          packageName: 'workspace-root',
        }),
      },
    ]));
  });

  it('ignores workspace without a version', async function() {
    fixturify.writeSync(tmpPath, {
      'package.json': stringifyJson({
        'name': 'workspace-root',
        'workspaces': [
          'packages/*',
        ],
      }),
      'index.js': 'console.log()',
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    expect(packagesWithChanges).to.deep.equal([]);
  });
});
