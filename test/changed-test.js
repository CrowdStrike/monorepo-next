'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const changed = require('../src/changed');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');

describe(changed, function() {
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
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

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
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let _changed = await changed({
      cwd: tmpPath,
      silent: true,
    });

    expect(_changed).to.deep.equal([
      'package-a',
      'my-app-1',
      'package-b',
      'root',
    ]);
  });
});
