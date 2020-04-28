'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const changedFiles = require('../src/changed-files');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const path = require('path');
const { gitInit } = require('git-fixtures');

describe(changedFiles, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await tmpDir();

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
      'changed.txt2': 'test',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let _changedFiles = await changedFiles({
      cwd: tmpPath,
      silent: true,
      ext: 'txt',
    });

    expect(_changedFiles).to.deep.equal([
      'packages/package-a/changed.txt',
    ]);
  });
});
