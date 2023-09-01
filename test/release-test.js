'use strict';

const { describe, it, setUpSinon } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const _release = require('../src/release');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');
const {
  getLastCommitMessage,
  getTagsOnLastCommit,
  getCurrentCommit,
  doesTagExist,
  isGitClean,
  getWorkspaceCwd,
} = require('./helpers/git');
const { EOL } = require('os');
const readWorkspaces = require('./helpers/read-workspaces');
const { builder } = require('../bin/commands/release');
const path = require('path');
const fs = require('fs-extra');
const { createTmpDir } = require('../src/tmp');

describe(_release, function() {
  this.timeout(10e3);

  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpSinon();

  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit({
      defaultBranchName: builder['default-branch'].default,
    });

    if (process.platform === 'darwin') {
      // prepend /private in mac
      tmpPath = await getWorkspaceCwd(tmpPath);
    }
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
            'name': 'my-app',
            'private': true,
            'version': '1.0.0',
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

    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-b@2.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-c@3.0.0'], { cwd: tmpPath });

    await execa('git', ['add', 'packages/package-a'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo', '-m', 'BREAKING CHANGE: bar'], { cwd: tmpPath });
    await execa('git', ['add', 'packages/package-b'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });
    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await release({
      shouldInheritGreaterReleaseType: true,
    });

    let workspace = readWorkspaces(tmpPath);

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
            'name': 'my-app',
            'private': true,
            'version': '1.0.1',
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

    expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@2.0.0,@scope/package-b@3.0.0,@scope/package-c@3.0.1,my-app@1.0.1');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@2.0.0',
      '@scope/package-b@3.0.0',
      '@scope/package-c@3.0.1',
      'my-app@1.0.1',
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

    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-b@2.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-c@3.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'my-app@0.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'root@0.0.0'], { cwd: tmpPath });

    await execa('git', ['add', 'packages/package-a'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo', '-m', 'BREAKING CHANGE: bar'], { cwd: tmpPath });
    await execa('git', ['add', 'packages/package-b'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });
    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await release({
      shouldInheritGreaterReleaseType: true,
    });

    let workspace = readWorkspaces(tmpPath);

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

    expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@2.0.0,@scope/package-b@3.0.0,@scope/package-c@3.0.1,my-app@0.0.1,root@1.0.0');

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'my-app@0.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'root@0.0.0'], { cwd: tmpPath });

    await release();

    let workspace = readWorkspaces(tmpPath);

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

  it('prevents release on non-default branch', async function() {
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'root@0.0.0'], { cwd: tmpPath });

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
        'private': true,
        'name': 'root',
        'version': '0.0.0',
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    await execa('git', ['checkout', '-b', 'test-branch'], { cwd: tmpPath });

    await release();

    let workspace = readWorkspaces(tmpPath);

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
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
      }),
    });

    let lastCommitMessage = await getLastCommitMessage(tmpPath);

    expect(lastCommitMessage).to.equal('fix: foo');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([]);
  });

  describe('defaultBranch', function () {
    it('works', async function() {
      await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
      await execa('git', ['tag', 'root@0.0.0'], { cwd: tmpPath });

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
          'private': true,
          'name': 'root',
          'version': '0.0.0',
          'workspaces': [
            'packages/*',
          ],
        }),
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

      await execa('git', ['checkout', '-b', 'test-branch'], { cwd: tmpPath });

      await release({
        defaultBranch: 'test-branch',
      });

      let workspace = readWorkspaces(tmpPath);

      expect(workspace).to.deep.equal({
        'packages': {
          'package-a': {
            'package.json': stringifyJson({
              'name': '@scope/package-a',
              'version': '1.0.1',
            }),
          },
        },
        'package.json': stringifyJson({
          'private': true,
          'name': 'root',
          'version': '0.0.1',
          'workspaces': [
            'packages/*',
          ],
        }),
      });

      let lastCommitMessage = await getLastCommitMessage(tmpPath);

      expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@1.0.1,root@0.0.1');

      let tags = await getTagsOnLastCommit(tmpPath);

      expect(tags).to.deep.equal([
        '@scope/package-a@1.0.1',
        'root@0.0.1',
      ]);
    });

    it('prevents release on non-default branch', async function() {
      await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
      await execa('git', ['tag', 'root@0.0.0'], { cwd: tmpPath });

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
          'private': true,
          'name': 'root',
          'version': '0.0.0',
          'workspaces': [
            'packages/*',
          ],
        }),
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

      await release({
        defaultBranch: 'test-branch',
      });

      let workspace = readWorkspaces(tmpPath);

      expect(workspace).to.deep.equal({
        'packages': {
          'package-a': {
            'package.json': stringifyJson({
              'name': '@scope/package-a',
              'version': '1.0.0',
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
        }),
      });

      let lastCommitMessage = await getLastCommitMessage(tmpPath);

      expect(lastCommitMessage).to.equal('fix: foo');

      let tags = await getTagsOnLastCommit(tmpPath);

      expect(tags).to.deep.equal([]);
    });
  });

  it('can clean up after a failed push', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'package.json': stringifyJson({
            'private': true,
            'name': 'my-app',
            'version': '1.0.0',
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
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

    let previousCommit = await getCurrentCommit(tmpPath);

    let pushOverride = this.stub().rejects(new Error('test push failed'));

    let promise = release({
      shouldPush: true,
      pushOverride,
      shouldCleanUpAfterFailedPush: true,
    });

    await expect(promise).to.eventually.be.rejectedWith('test push failed');

    let currentCommit = await getCurrentCommit(tmpPath);

    expect(currentCommit).to.equal(previousCommit);

    expect(await isGitClean(tmpPath)).to.be.true;

    expect(await doesTagExist('my-app@1.0.1')).to.be.false;
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-b@1.0.0'], { cwd: tmpPath });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: true,
      shouldInheritGreaterReleaseType: false,
    });

    let workspace = readWorkspaces(tmpPath);

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-b@1.0.0'], { cwd: tmpPath });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: false,
      shouldInheritGreaterReleaseType: false,
    });

    let workspace = readWorkspaces(tmpPath);

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
    await execa('git', ['tag', '@scope/package-b@1.0.0'], { cwd: tmpPath });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: false,
      shouldInheritGreaterReleaseType: true,
    });

    let workspace = readWorkspaces(tmpPath);

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
    await execa('git', ['tag', '@scope/package-b@1.0.0'], { cwd: tmpPath });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: false,
      shouldInheritGreaterReleaseType: false,
    });

    let workspace = readWorkspaces(tmpPath);

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
    await execa('git', ['tag', '@scope/package-b@1.0.0'], { cwd: tmpPath });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    await release({
      shouldBumpInRangeDependencies: true,
      shouldInheritGreaterReleaseType: true,
    });

    let workspace = readWorkspaces(tmpPath);

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

  it('doesn\'t bump version when dev dep changes', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.0.0',
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'devDependencies': {
              '@scope/package-a': '1.0.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '1.0.0',
            'dependencies': {
              '@scope/package-b': '1.0.0',
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-b@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-c@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let publishOverride = this.spy();

    await release({
      shouldBumpInRangeDependencies: true,
      shouldInheritGreaterReleaseType: true,
      shouldExcludeDevChanges: true,
      shouldPublish: true,
      publishOverride,
    });

    let workspace = readWorkspaces(tmpPath);

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.1.0',
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'devDependencies': {
              '@scope/package-a': '1.1.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '1.0.0',
            'dependencies': {
              '@scope/package-b': '1.0.0',
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

    expect(publishOverride).calledOnceWith(this.match({
      cwd: this.match('packages/package-a'),
    }));
  });

  it('can release a package without an initial version', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '0.0.0',
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
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    await release();

    let workspace = readWorkspaces(tmpPath);

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '0.1.0',
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

    expect(lastCommitMessage).to.equal('chore(release): @scope/package-a@0.1.0');

    let tags = await getTagsOnLastCommit(tmpPath);

    expect(tags).to.deep.equal([
      '@scope/package-a@0.1.0',
    ]);
  });

  it('can handle a lifecycle script with `&&`', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '0.0.0',
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
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let spy = this.spy(execa, 'command');

    let precommit = 'echo foo&& echo bar';

    await release({
      scripts: {
        precommit,
      },
    });

    let { stdout } = await spy.withArgs(precommit).firstCall.returnValue;

    expect(stdout).to.equal(['foo', 'bar'].join(EOL));
  });

  it('ignores child package changes in root package', async function() {
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
        'name': 'root',
        'version': '1.0.0',
        'private': true,
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'root@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    await release({
      shouldInheritGreaterReleaseType: true,
    });

    let workspace = readWorkspaces(tmpPath);

    expect(workspace).to.deep.equal({
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '1.1.0',
          }),
        },
      },
      'package.json': stringifyJson({
        'name': 'root',
        'version': '1.0.0',
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

  describe('dry run', function() {
    const dryRun = true;

    let consoleLog;
    let gitCopyPath;

    beforeEach(async function() {
      fixturify.writeSync(tmpPath, {
        'packages': {
          'package-a': {
            'package.json': stringifyJson({
              'name': '@scope/package-a',
              'version': '1.0.0-detached',
            }),
          },
        },
        'package.json': stringifyJson({
          'name': 'root',
          'version': '1.0.0',
          'private': true,
          'workspaces': [
            'packages/*',
          ],
          'devDependencies': {
            '@scope/package-a': '1.0.0 || 1.0.0-detached',
          },
        }),
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });
      await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
      await execa('git', ['tag', 'root@1.0.0'], { cwd: tmpPath });

      fixturify.writeSync(tmpPath, {
        'packages': {
          'package-a': {
            'index.js': 'console.log()',
          },
        },
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

      consoleLog = this.stub(console, 'log');

      gitCopyPath = await createTmpDir();

      await fs.copy(path.join(tmpPath, '.git'), gitCopyPath);
    });

    async function assertCleanGit() {
      expect(fixturify.readSync(path.join(tmpPath, '.git'))).to.deep.equal(fixturify.readSync(gitCopyPath));

      expect(await isGitClean(tmpPath)).to.be.true;
    }

    it('works', async function() {
      let preCommitCallback = this.spy();
      let prePushCallback = this.spy();
      let prePublishCallback = this.spy();

      await release({
        dryRun,
        scripts: {
          precommit: 'precommit test',
          postcommit: 'postcommit test',
          pretag: 'pretag test',
          posttag: 'posttag test',
        },
        silent: false,
        shouldPush: true,
        shouldPublish: true,
        preCommitCallback,
        prePushCallback,
        prePublishCallback,
      });

      await assertCleanGit();

      expect(consoleLog.args).to.deep.equal([
        ['Updating @scope/package-a from 1.0.0-detached to 1.0.0.'],
        ['Updating root devDependencies @scope/package-a from 1.0.0 || 1.0.0-detached to 1.1.0.'],
        ['precommit test', { shell: true }],
        ['git', ['commit', '-m', 'chore(release): @scope/package-a@1.1.0,root@1.0.1'], { cwd: tmpPath }],
        ['postcommit test', { shell: true }],
        ['pretag test', { shell: true }],
        ['git', ['tag', '-a', '@scope/package-a@1.1.0', '-m', '@scope/package-a@1.1.0'], { cwd: tmpPath }],
        ['git', ['tag', '-a', 'root@1.0.1', '-m', 'root@1.0.1'], { cwd: tmpPath }],
        ['posttag test', { shell: true }],
        ['push'],
        ['publish'],
      ]);
    });

    it('works with overrides', async function() {
      let pushOverride = this.stub().callsFake(({ originalPush }) => originalPush());
      let publishOverride = this.stub().callsFake(({ originalPublish }) => originalPublish());

      await release({
        dryRun,
        silent: false,
        shouldPush: true,
        shouldPublish: true,
        pushOverride,
        publishOverride,
      });

      await assertCleanGit();

      expect(consoleLog.args).to.deep.equal([
        ['Updating @scope/package-a from 1.0.0-detached to 1.0.0.'],
        ['Updating root devDependencies @scope/package-a from 1.0.0 || 1.0.0-detached to 1.1.0.'],
        ['git', ['commit', '-m', 'chore(release): @scope/package-a@1.1.0,root@1.0.1'], { cwd: tmpPath }],
        ['git', ['tag', '-a', '@scope/package-a@1.1.0', '-m', '@scope/package-a@1.1.0'], { cwd: tmpPath }],
        ['git', ['tag', '-a', 'root@1.0.1', '-m', 'root@1.0.1'], { cwd: tmpPath }],
        ['push'],
        ['publish'],
      ]);

      expect(pushOverride.args).to.match([[this.match({ dryRun: true })]]);
      expect(publishOverride.args).to.match([[this.match({ dryRun: true })]]);
    });
  });
});
