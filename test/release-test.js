'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const _release = require('../src/release');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const exec = promisify(require('child_process').exec);
const { gitInit } = require('git-fixtures');

async function getLastCommitMessage(cwd) {
  return (await exec('git log -1 --pretty=%B', { cwd })).stdout.trim();
}

async function getTagsOnLastCommit(cwd) {
  return (await exec('git tag -l --points-at HEAD', { cwd })).stdout.trim().split(/\r?\n/).filter(Boolean);
}

describe(_release, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await tmpDir();

    await gitInit({ cwd: tmpPath });
    await exec('git commit --allow-empty -m "first"', { cwd: tmpPath });
  });

  async function release(options) {
    await _release({
      cwd: tmpPath,
      silent: true,
      shouldPush: false,
      shouldPublish: false,
      ...options,
    });
  }

  it('works', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0-detached',
            'devDependencies': {
              '@scope/package-b': '^2.0.0 || 2.0.0-detached',
              '@scope/package-c': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '2.0.0-detached',
            'dependencies': {
              '@scope/package-a': '^1.0.0 || 1.0.0-detached',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '3.0.0',
            'dependencies': {
              '@scope/package-b': '^2.0.0',
            },
            'devDependencies': {
              '@scope/package-a': '^1.0.0 || 1.0.0-detached',
            },
          }),
        },
        'my-app': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app',
            'devDependencies': {
              '@scope/package-a': '^1.0.0 || 1.0.0-detached',
              '@scope/package-b': '^2.0.0',
              '@scope/package-c': '^3.0.0',
            },
          }),
        },
        // test that this doesn't break the update
        '.gitignore': '',
      },
      'package.json': stringifyJson({
        'private': true,
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^1.0.0 || 1.0.0-detached',
          '@scope/package-b': '^1.0.0',
        },
      }),
    });

    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });
    await exec('git tag @scope/package-b@2.0.0', { cwd: tmpPath });
    await exec('git tag @scope/package-c@3.0.0', { cwd: tmpPath });

    await exec('git add packages/package-a', { cwd: tmpPath });
    await exec('git commit -m "fix: foo" -m "BREAKING CHANGE: bar"', { cwd: tmpPath });
    await exec('git add packages/package-b', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });
    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });

    await release({
      shouldInheritGreaterReleaseType: true,
    });

    let workspace = fixturify.readSync(tmpPath, {
      exclude: [
        '.git',
        '**/CHANGELOG.md',
      ],
    });

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '2.0.0',
            'devDependencies': {
              '@scope/package-b': '^3.0.0',
              '@scope/package-c': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '3.0.0',
            'dependencies': {
              '@scope/package-a': '^2.0.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '3.0.1',
            'dependencies': {
              '@scope/package-b': '^2.0.0',
            },
            'devDependencies': {
              '@scope/package-a': '^2.0.0',
            },
          }),
        },
        'my-app': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app',
            'devDependencies': {
              '@scope/package-a': '^2.0.0',
              '@scope/package-b': '^2.0.0',
              '@scope/package-c': '^3.0.1',
            },
          }),
        },
        '.gitignore': '',
      },
      'package.json': stringifyJson({
        'private': true,
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^2.0.0',
          '@scope/package-b': '^1.0.0',
        },
      }),
    });

    let lastCommitMessage = await getLastCommitMessage(tmpPath);

    expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@2.0.0,@scope/package-b@3.0.0,@scope/package-c@3.0.1');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@2.0.0',
      '@scope/package-b@3.0.0',
      '@scope/package-c@3.0.1',
    ]);
  });

  it('can version private packages', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0-detached',
            'devDependencies': {
              '@scope/package-b': '^2.0.0 || 2.0.0-detached',
              '@scope/package-c': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '2.0.0-detached',
            'dependencies': {
              '@scope/package-a': '^1.0.0 || 1.0.0-detached',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '3.0.0',
            'dependencies': {
              '@scope/package-b': '^2.0.0',
            },
            'devDependencies': {
              '@scope/package-a': '^1.0.0 || 1.0.0-detached',
            },
          }),
        },
        'my-app': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app',
            'version': '0.0.0',
            'devDependencies': {
              '@scope/package-a': '^1.0.0 || 1.0.0-detached',
              '@scope/package-b': '^2.0.0',
              '@scope/package-c': '^3.0.0',
            },
          }),
        },
        // test that this doesn't break the update
        '.gitignore': '',
      },
      'package.json': stringifyJson({
        'private': true,
        'name': 'root',
        'version': '0.0.0',
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^1.0.0 || 1.0.0-detached',
          '@scope/package-b': '^1.0.0',
        },
      }),
    });

    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });
    await exec('git tag @scope/package-b@2.0.0', { cwd: tmpPath });
    await exec('git tag @scope/package-c@3.0.0', { cwd: tmpPath });
    await exec('git tag my-app@0.0.0', { cwd: tmpPath });
    await exec('git tag root@0.0.0', { cwd: tmpPath });

    await exec('git add packages/package-a', { cwd: tmpPath });
    await exec('git commit -m "fix: foo" -m "BREAKING CHANGE: bar"', { cwd: tmpPath });
    await exec('git add packages/package-b', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });
    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });

    await release({
      shouldInheritGreaterReleaseType: true,
    });

    let workspace = fixturify.readSync(tmpPath, {
      exclude: [
        '.git',
        '**/CHANGELOG.md',
      ],
    });

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '2.0.0',
            'devDependencies': {
              '@scope/package-b': '^3.0.0',
              '@scope/package-c': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '3.0.0',
            'dependencies': {
              '@scope/package-a': '^2.0.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '3.0.1',
            'dependencies': {
              '@scope/package-b': '^2.0.0',
            },
            'devDependencies': {
              '@scope/package-a': '^2.0.0',
            },
          }),
        },
        'my-app': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app',
            'version': '0.0.1',
            'devDependencies': {
              '@scope/package-a': '^2.0.0',
              '@scope/package-b': '^2.0.0',
              '@scope/package-c': '^3.0.1',
            },
          }),
        },
        '.gitignore': '',
      },
      'package.json': stringifyJson({
        'private': true,
        'name': 'root',
        'version': '1.0.0',
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^2.0.0',
          '@scope/package-b': '^1.0.0',
        },
      }),
    });

    let lastCommitMessage = await getLastCommitMessage(tmpPath);

    expect(lastCommitMessage).to.equal('chore(release): my-app@0.0.1,@scope/package-a@2.0.0,@scope/package-b@3.0.0,@scope/package-c@3.0.1,root@1.0.0');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@2.0.0',
      '@scope/package-b@3.0.0',
      '@scope/package-c@3.0.1',
      'my-app@0.0.1',
      'root@1.0.0',
    ]);
  });

  it('gracefully handles no release necessary', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
        'my-app': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app',
            'version': '0.0.0',
            'devDependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
      },
      'package.json': stringifyJson({
        'private': true,
        'name': 'root',
        'version': '0.0.0',
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^1.0.0',
        },
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });

    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });
    await exec('git tag my-app@0.0.0', { cwd: tmpPath });
    await exec('git tag root@0.0.0', { cwd: tmpPath });

    await release();

    let workspace = fixturify.readSync(tmpPath, {
      exclude: [
        '.git',
        '**/CHANGELOG.md',
      ],
    });

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
        'my-app': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app',
            'version': '0.0.0',
            'devDependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
      },
      'package.json': stringifyJson({
        'private': true,
        'name': 'root',
        'version': '0.0.0',
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^1.0.0',
        },
      }),
    });

    let lastCommitMessage = await getLastCommitMessage(tmpPath);

    expect(lastCommitMessage).to.equal('fix: foo');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@1.0.0',
      'my-app@0.0.0',
      'root@0.0.0',
    ]);
  });

  it('bumps in-range versions', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'dependencies': {
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
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });
    await exec('git tag @scope/package-b@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
      },
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: true,
      shouldInheritGreaterReleaseType: false,
    });

    let workspace = fixturify.readSync(tmpPath, {
      exclude: [
        '.git',
        '**/CHANGELOG.md',
      ],
    });

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.1.0',
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.1',
            'dependencies': {
              '@scope/package-a': '^1.1.0',
            },
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

    let lastCommitMessage = await getLastCommitMessage(tmpPath);

    expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@1.1.0,@scope/package-b@1.0.1');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@1.1.0',
      '@scope/package-b@1.0.1',
    ]);
  });

  it('ignores in-range versions', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'dependencies': {
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
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });
    await exec('git tag @scope/package-b@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
      },
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: false,
      shouldInheritGreaterReleaseType: false,
    });

    let workspace = fixturify.readSync(tmpPath, {
      exclude: [
        '.git',
        '**/CHANGELOG.md',
      ],
    });

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.1.0',
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'dependencies': {
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
      }),
    });

    let lastCommitMessage = await getLastCommitMessage(tmpPath);

    expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@1.1.0');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@1.1.0',
    ]);
  });

  it('inherits greater release type', async function() {
    await exec('git tag @scope/package-b@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'dependencies': {
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
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
      },
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: false,
      shouldInheritGreaterReleaseType: true,
    });

    let workspace = fixturify.readSync(tmpPath, {
      exclude: [
        '.git',
        '**/CHANGELOG.md',
      ],
    });

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.1.0',
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.1.0',
            'dependencies': {
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
      }),
    });

    let lastCommitMessage = await getLastCommitMessage(tmpPath);

    expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@1.1.0,@scope/package-b@1.1.0');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@1.1.0',
      '@scope/package-b@1.1.0',
    ]);
  });

  it('ignores greater release type', async function() {
    await exec('git tag @scope/package-b@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'dependencies': {
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
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
      },
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: false,
      shouldInheritGreaterReleaseType: false,
    });

    let workspace = fixturify.readSync(tmpPath, {
      exclude: [
        '.git',
        '**/CHANGELOG.md',
      ],
    });

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.1.0',
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.1',
            'dependencies': {
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
      }),
    });

    let lastCommitMessage = await getLastCommitMessage(tmpPath);

    expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@1.1.0,@scope/package-b@1.0.1');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@1.1.0',
      '@scope/package-b@1.0.1',
    ]);
  });

  it('inherits greater and bumps in-range', async function() {
    await exec('git tag @scope/package-b@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'dependencies': {
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
      }),
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
      },
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: true,
      shouldInheritGreaterReleaseType: true,
    });

    let workspace = fixturify.readSync(tmpPath, {
      exclude: [
        '.git',
        '**/CHANGELOG.md',
      ],
    });

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.1.0',
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.1.0',
            'dependencies': {
              '@scope/package-a': '^1.1.0',
            },
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

    let lastCommitMessage = await getLastCommitMessage(tmpPath);

    expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@1.1.0,@scope/package-b@1.1.0');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@1.1.0',
      '@scope/package-b@1.1.0',
    ]);
  });
});
