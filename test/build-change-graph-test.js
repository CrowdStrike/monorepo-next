'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const buildDepGraph = require('../src/build-dep-graph');
const buildChangeGraph = require('../src/build-change-graph');
const { createTmpDir } = require('./helpers/tmp');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const sinon = require('sinon');
const { gitInit } = require('git-fixtures');
const { getCurrentCommit } = require('../src/git');

describe(buildChangeGraph, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await createTmpDir();

    await gitInit({ cwd: tmpPath });
    await execa('git', ['commit', '--allow-empty', '-m', 'first'], { cwd: tmpPath });
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

    await execa('git', ['commit', '--allow-empty', '-m', 'feat: foo'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.deep.equal([]);
  });

  it('tracks dirty package changes', async function() {
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', 'workspace-root@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'index.js': 'console.log()',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.deep.equal([]);
  });

  it('accepts a package without a version tag', async function() {
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.match(sinon.match([
      {
        changedFiles: [
          'packages/package-a/index.js',
          'packages/package-a/package.json',
        ],
        dag: sinon.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
  });

  it('accepts an arbitrary commit to calculate difference', async function() {
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      fromCommit: commit,
    });

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
});
