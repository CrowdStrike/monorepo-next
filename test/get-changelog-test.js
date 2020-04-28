'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const getChangelog = require('../src/get-changelog');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');
const path = require('path');
const standardVersion = require('standard-version');

const originalCwd = process.cwd();

describe(getChangelog, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await tmpDir();

    await gitInit({ cwd: tmpPath });
    await execa('git', ['commit', '--allow-empty', '-m', 'first'], { cwd: tmpPath });
  });

  afterEach(function() {
    process.chdir(originalCwd);
  });

  it('works pre tag', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'package.json': stringifyJson({
            'name': '@scope/my-app',
            'version': '1.0.0',
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'chore: release'], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    await standardVersion({
      path: path.join(tmpPath, 'packages/my-app'),
      tagPrefix: '@scope/my-app@',
      firstRelease: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'foo',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
    });

    expect(changelog).to.include('[1.0.1]');
    expect(changelog).to.include('* foo');
    expect(changelog).to.not.include('[1.0.0]');
  });

  it('works post tag', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'package.json': stringifyJson({
            'name': '@scope/my-app',
            'version': '1.0.0',
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'chore: release'], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    await standardVersion({
      path: path.join(tmpPath, 'packages/my-app'),
      tagPrefix: '@scope/my-app@',
      firstRelease: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'foo',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await standardVersion({
      path: path.join(tmpPath, 'packages/my-app'),
      tagPrefix: '@scope/my-app@',
    });

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
    });

    expect(changelog).to.include('[1.0.1]');
    expect(changelog).to.include('* foo');
    expect(changelog).to.not.include('[1.0.0]');
  });

  it('no package changes when pre tag', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'package.json': stringifyJson({
            'name': '@scope/my-app',
            'version': '1.0.0',
          }),
        },
        'my-app-2': {
          'package.json': stringifyJson({
            'name': '@scope/my-app-2',
            'version': '1.0.0',
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'chore: release'], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    await standardVersion({
      path: path.join(tmpPath, 'packages/my-app'),
      tagPrefix: '@scope/my-app@',
      firstRelease: true,
    });

    process.chdir(path.join(tmpPath, 'packages/my-app-2'));

    await standardVersion({
      path: path.join(tmpPath, 'packages/my-app-2'),
      tagPrefix: '@scope/my-app-2@',
      firstRelease: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-2': {
          'index.js': 'foo',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
    });

    expect(changelog).to.include('[1.0.0]');
  });

  it('can generate more than one release', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'package.json': stringifyJson({
            'name': '@scope/my-app',
            'version': '1.0.0',
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: old-release'], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    await standardVersion({
      path: path.join(tmpPath, 'packages/my-app'),
      tagPrefix: '@scope/my-app@',
      firstRelease: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'foo',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await standardVersion({
      path: path.join(tmpPath, 'packages/my-app'),
      tagPrefix: '@scope/my-app@',
    });

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
      tagFormat: 'foo/bar-*',
      releaseCount: 2,
    });

    expect(changelog).to.include('[1.0.1]');
    expect(changelog).to.include('* foo');
    expect(changelog).to.include('[1.0.0]');
    expect(changelog).to.include('* old-release');
  });

  it('works when dep is only changed', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'package.json': stringifyJson({
            'name': '@scope/my-app',
            'version': '1.0.0',
            'dependencies': {
              '@scope/my-dep': '1.0.0',
            },
          }),
        },
        'my-dep': {
          'package.json': stringifyJson({
            'name': '@scope/my-dep',
            'version': '1.0.0',
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'chore: release'], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-dep'));

    await standardVersion({
      path: path.join(tmpPath, 'packages/my-dep'),
      tagPrefix: '@scope/my-dep@',
      firstRelease: true,
    });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    await standardVersion({
      path: path.join(tmpPath, 'packages/my-app'),
      tagPrefix: '@scope/my-app@',
      firstRelease: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-dep': {
          'index.js': 'foo',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
    });

    expect(changelog).to.include('[1.0.1]');
    expect(changelog).to.not.include('[1.0.0]');
  });
});
