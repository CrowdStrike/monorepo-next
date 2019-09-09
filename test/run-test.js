'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const run = require('../src/run');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const exec = promisify(require('child_process').exec);

describe(run, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await tmpDir();

    await exec('git init', { cwd: tmpPath });
    await exec('git config user.email "you@example.com"', { cwd: tmpPath });
    await exec('git config user.name "Your Name"', { cwd: tmpPath });
    // ignore any global .gitignore that will mess with us
    await exec('git config --local core.excludesfile false', { cwd: tmpPath });
    await exec('git commit --allow-empty -m "first"', { cwd: tmpPath });
  });

  it('works', async function() {
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
            'scripts': {
              'start': 'echo package-a',
            },
            'devDependencies': {
              '@scope/package-b': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'scripts': {
              'start': 'echo package-b',
            },
            'devDependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '1.0.0',
            'scripts': {
              'start': 'echo package-c',
            },
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
            'scripts': {
              'start': 'echo my-app-1',
            },
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
            'scripts': {
              'start': 'echo my-app-2',
            },
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
        'scripts': {
          'start': 'echo root',
        },
        'devDependencies': {
          '@scope/package-a': '^1.0.0',
          '@scope/package-c': '^1.0.0',
        },
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });

    await exec('git tag @scope/package-b@1.0.0', { cwd: tmpPath });
    await exec('git tag @scope/package-c@1.0.0', { cwd: tmpPath });
    await exec('git tag my-app-1@0.0.0', { cwd: tmpPath });
    await exec('git tag my-app-2@0.0.0', { cwd: tmpPath });
    await exec('git tag root@0.0.0', { cwd: tmpPath });

    let {
      stdout,
    } = await run({
      cwd: tmpPath,
      silent: true,
      args: ['start'],
    });

    expect(stdout).to.match(/^package-a/m);
    expect(stdout).to.match(/^package-b/m);
    expect(stdout).to.match(/^my-app-1/m);
    expect(stdout).to.match(/^root/m);
  });
});
