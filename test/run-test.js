'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const run = require('../src/run');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const { gitInit } = require('git-fixtures');

describe(run, function() {
  this.timeout(30e3);

  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit();
  });

  it('works', async function() {
    await (await import('execa')).execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

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

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    await (await import('execa')).execa('git', ['tag', '@scope/package-b@1.0.0'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['tag', '@scope/package-c@1.0.0'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['tag', 'my-app-1@0.0.0'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['tag', 'my-app-2@0.0.0'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['tag', 'root@0.0.0'], { cwd: tmpPath });

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
