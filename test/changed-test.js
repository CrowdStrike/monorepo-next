'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const changed = require('../src/changed');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');
const { getCurrentCommit } = require('./helpers/git');

describe(changed, function() {
  this.timeout(5e3);

  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit({
      defaultBranchName: 'master',
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
            'devDependencies': {
              '@scope/package-b': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'devDependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '1.0.0',
            'dependencies': {
              '@scope/package-b': '^1.0.0',
            },
          }),
        },
        'my-app-1': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app-1',
            'version': '0.0.0',
            'devDependencies': {
              '@scope/package-a': '^1.0.0',
              '@scope/package-c': '^1.0.0',
            },
          }),
        },
        'my-app-2': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app-2',
            'version': '0.0.0',
            'devDependencies': {
              '@scope/package-b': '^1.0.0',
              '@scope/package-c': '^1.0.0',
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
          '@scope/package-c': '^1.0.0',
        },
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-b@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-c@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'my-app-1@0.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'my-app-2@0.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'root@0.0.0'], { cwd: tmpPath });
  });

  it('works', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let _changed = await changed({
      cwd: tmpPath,
      silent: true,
    });

    expect(_changed).to.deep.equal([
      '@scope/package-a',
      '@scope/package-b',
      'my-app-1',
      'root',
    ]);
  });

  it('accepts an arbitrary from commit to calculate difference', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-1': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-2': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let _changed = await changed({
      cwd: tmpPath,
      silent: true,
      fromCommit: commit,
    });

    expect(_changed).to.deep.equal([
      'my-app-2',
    ]);
  });

  it('accepts an arbitrary to commit to calculate difference', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-1': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-2': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let _changed = await changed({
      cwd: tmpPath,
      silent: true,
      toCommit: commit,
    });

    expect(_changed).to.deep.equal([
      'my-app-1',
    ]);
  });

  it('can calulate difference since branch point', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['checkout', '-b', 'test-branch'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-2': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let _changed = await changed({
      cwd: tmpPath,
      silent: true,
      sinceBranch: 'master',
    });

    expect(_changed).to.deep.equal([
      'my-app-2',
    ]);

    _changed = await changed({
      cwd: tmpPath,
      silent: true,
    });

    expect(_changed).to.deep.equal([
      '@scope/package-a',
      '@scope/package-b',
      'my-app-1',
      'my-app-2',
      'root',
    ]);
  });

  it('can cache the results', async function() {
    this.timeout(5e3);

    let _changed;

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
      'changed': 'test',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let cachedChanged = await changed({
      cwd: tmpPath,
      silent: true,
      cached: true,
    });

    expect(cachedChanged).to.deep.equal([
      '@scope/package-a',
      '@scope/package-b',
      'my-app-1',
      'root',
    ]);

    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-2': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    _changed = await changed({
      cwd: tmpPath,
      silent: true,
      cached: true,
    });

    expect(_changed).to.deep.equal([
      '@scope/package-a',
      '@scope/package-b',
      'my-app-1',
      'root',
    ]);

    _changed = await changed({
      cwd: tmpPath,
      silent: true,
      fromCommit: commit,
      cached: true,
    });

    expect(_changed).to.deep.equal([
      'my-app-2',
    ]);

    _changed = await changed({
      cwd: tmpPath,
      silent: true,
    });

    expect(_changed).to.deep.equal([
      '@scope/package-a',
      '@scope/package-b',
      'my-app-1',
      'my-app-2',
      'root',
    ]);
  });
});
