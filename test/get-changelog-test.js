'use strict';

const { describe, it, setUpCwdReset } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const getChangelog = require('../src/get-changelog');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const { gitInit } = require('git-fixtures');
const path = require('path');
const {
  getCurrentCommit,
} = require('./helpers/git');
const { replaceJsonFile } = require('../src/fs');

describe(getChangelog, function() {
  this.timeout(5e3);

  let tmpPath;

  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpCwdReset();

  beforeEach(async function() {
    tmpPath = await gitInit();
  });

  // calling the real `standardVersion` is a lot slower
  async function fakeVersion({
    packageDir,
    newVersion,
    firstVersion,
  }) {
    let packageName;

    await replaceJsonFile(path.join(tmpPath, packageDir, 'package.json'), json => {
      if (firstVersion) {
        newVersion = json.version;
      } else {
        json.version = newVersion;
      }

      packageName = json.name;
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });

    try {
      await (await import('execa')).execa('git', ['commit', '-m', 'chore: release'], { cwd: tmpPath });
    } catch (err) {
      if (!firstVersion || !err.message.includes('nothing to commit, working tree clean')) {
        throw err;
      }
    }

    await (await import('execa')).execa('git', ['tag', `${packageName}@${newVersion}`], { cwd: tmpPath });
  }

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

    await fakeVersion({
      packageDir: 'packages/my-app',
      firstVersion: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'foo',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

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

    await fakeVersion({
      packageDir: 'packages/my-app',
      firstVersion: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'foo',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await fakeVersion({
      packageDir: 'packages/my-app',
      newVersion: '1.0.1',
    });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

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

    await fakeVersion({
      packageDir: 'packages/my-app',
      firstVersion: true,
    });

    await fakeVersion({
      packageDir: 'packages/my-app-2',
      firstVersion: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-2': {
          'index.js': 'foo',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

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

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: old-release'], { cwd: tmpPath });

    await fakeVersion({
      packageDir: 'packages/my-app',
      firstVersion: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'foo',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await fakeVersion({
      packageDir: 'packages/my-app',
      newVersion: '1.0.1',
    });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
      releaseCount: 2,
    });

    expect(changelog).to.include('[1.0.1]');
    expect(changelog).to.include('* foo');
    expect(changelog).to.include('[1.0.0]');
    expect(changelog).to.include('* old-release');
  });

  it('can generate less than one release', async function() {
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

    await fakeVersion({
      packageDir: 'packages/my-app',
      firstVersion: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'foo',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: ignored change'], { cwd: tmpPath });

    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'bar',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: included change'], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
      fromCommit: commit,
    });

    expect(changelog).to.not.include('* ignored change');
    expect(changelog).to.include('* included change');
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

    await fakeVersion({
      packageDir: 'packages/my-dep',
      firstVersion: true,
    });

    await fakeVersion({
      packageDir: 'packages/my-app',
      firstVersion: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-dep': {
          'index.js': 'foo',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
    });

    expect(changelog).to.include('[1.0.1]');
    expect(changelog).to.not.include('[1.0.0]');
  });

  it('can generate in reverse order (revert)', async function() {
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

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: old-release'], { cwd: tmpPath });

    await fakeVersion({
      packageDir: 'packages/my-app',
      firstVersion: true,
    });

    let oldCommit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'foo',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await fakeVersion({
      packageDir: 'packages/my-app',
      newVersion: '1.0.1',
    });

    let newCommit = await getCurrentCommit(tmpPath);

    await (await import('execa')).execa('git', ['reset', '--hard', oldCommit], { cwd: tmpPath });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
      fromCommit: newCommit,
    });

    expect(changelog).to.include('[1.0.0]');
    expect(changelog).to.not.include('[1.0.1]');
  });

  it('only generates one release when no changes', async function() {
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

    await fakeVersion({
      packageDir: 'packages/my-app',
      firstVersion: true,
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'foo',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await fakeVersion({
      packageDir: 'packages/my-app',
      newVersion: '1.0.1',
    });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'index.js': 'bar',
        },
      },
    });

    await (await import('execa')).execa('git', ['add', '.'], { cwd: tmpPath });
    await (await import('execa')).execa('git', ['commit', '-m', 'fix: bar'], { cwd: tmpPath });

    await fakeVersion({
      packageDir: 'packages/my-app',
      newVersion: '1.0.2',
    });

    process.chdir(path.join(tmpPath, 'packages/my-app'));

    let changelog = await getChangelog({
      cwd: path.join(tmpPath, 'packages/my-app'),
    });

    expect(changelog).to.include('[1.0.2]');
    expect(changelog).to.include('* bar');
    expect(changelog).to.not.include('[1.0.1]');
    expect(changelog).to.not.include('* foo');
  });
});
