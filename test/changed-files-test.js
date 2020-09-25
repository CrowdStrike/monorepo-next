'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const changedFiles = require('../src/changed-files');
const { createTmpDir } = require('./helpers/tmp');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const path = require('path');
const { gitInit } = require('git-fixtures');
const { getCurrentCommit } = require('./helpers/git');

describe(changedFiles, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await createTmpDir();

    await gitInit({ cwd: tmpPath });
    await execa('git', ['commit', '--allow-empty', '-m', 'first'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
        'my-app-1': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app-1',
            'version': '0.0.0',
            'devDependencies': {
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
        'name': 'root',
        'version': '0.0.0',
        'devDependencies': {
          '@scope/package-a': '^1.0.0',
        },
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'my-app-1@0.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'root@0.0.0'], { cwd: tmpPath });
  });

  it('works at root with no package', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
      'changed.txt': 'test',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
    });

    expect(_changedFiles).to.deep.equal([
      'packages/package-a/changed.txt',
      'changed.txt',
    ]);
  });

  it('works at root with package', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
      'changed.txt': 'test',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
      packages: [
        'package-a',
      ],
    });

    expect(_changedFiles).to.deep.equal([
      'packages/package-a/changed.txt',
    ]);
  });

  it('works when run from package', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
      'changed.txt': 'test',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let _changedFiles = await changedFiles({
      cwd: path.join(tmpPath, 'packages/package-a'),
      silent: true,
    });

    expect(_changedFiles).to.deep.equal([
      'packages/package-a/changed.txt',
    ]);
  });

  it('filters extensions', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
      // make sure the dot is included
      'changedtxt': 'test',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
      exts: ['txt', 'none'],
    });

    expect(_changedFiles).to.deep.equal([
      'packages/package-a/changed.txt',
    ]);
  });

  it('accepts an arbitrary commit to calculate difference', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-1': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-2': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
      fromCommit: commit,
    });

    expect(_changedFiles).to.deep.equal([
      'packages/my-app-2/changed.txt',
    ]);
  });

  it('can cache the results', async function() {
    this.timeout(5e3);

    let _changedFiles;

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
      'changed': 'test',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let cachedChangedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
      cached: true,
      packages: [
        'package-a',
      ],
      exts: ['txt'],
    });

    expect(cachedChangedFiles).to.deep.equal([
      'packages/package-a/changed.txt',
    ]);

    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-1': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
      cached: true,
    });

    expect(_changedFiles).to.deep.equal([
      'packages/package-a/changed.txt',
      'changed',
    ]);

    _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
      cached: true,
      exts: ['txt'],
    });

    expect(_changedFiles).to.deep.equal([
      'packages/package-a/changed.txt',
    ]);

    _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
      cached: true,
      packages: [
        'package-a',
      ],
    });

    expect(_changedFiles).to.deep.equal([
      'packages/package-a/changed.txt',
    ]);

    _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
      fromCommit: commit,
      cached: true,
    });

    expect(_changedFiles).to.deep.equal([
      'packages/my-app-1/changed.txt',
    ]);

    _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
    });

    expect(_changedFiles).to.deep.equal([
      'packages/my-app-1/changed.txt',
      'packages/package-a/changed.txt',
      'changed',
    ]);
  });
});
