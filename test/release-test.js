'use strict';

const { describe, it, setUpSinon } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const _release = require('../src/release');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit, cloneRemote } = require('git-fixtures');
const {
  getLastCommitMessage,
  getTagsOnLastCommit,
  getCurrentCommit,
  doesTagExist,
  isGitClean,
  getWorkspaceCwd,
  git,
} = require('./helpers/git');
const { EOL } = require('os');
const readWorkspaces = require('./helpers/read-workspaces');
const { builder } = require('../bin/commands/release');
const path = require('path');
const fs = require('fs-extra');
const { createTmpDir } = require('../src/tmp');

const defaultBranchName = builder['default-branch'].default;

describe(_release, function() {
  this.timeout(10e3);

  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpSinon();

  let tmpPath;
  let consoleLog;
  let updatePnpmLockfile;
  let updateYarnLockfile;

  beforeEach(async function() {
    tmpPath = await gitInit({
      defaultBranchName,
    });

    if (process.platform === 'darwin') {
      // prepend /private in mac
      tmpPath = await getWorkspaceCwd(tmpPath);
    }

    consoleLog = this.stub(console, 'log');
    updatePnpmLockfile = this.stub(_release, 'updatePnpmLockfile');
    updateYarnLockfile = this.stub(_release, 'updateYarnLockfile');
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

    expect(lastCommitMessage).to.equal('chore(release): my-app@1.0.1,@scope/package-a@2.0.0,@scope/package-b@3.0.0,@scope/package-c@3.0.1');

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

    expect(consoleLog).to.be.calledOnceWith('no releasable code');
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

    expect(consoleLog).to.be.calledOnceWith(`branch mismatch. defaultBranch: ${defaultBranchName}, currentBranch: test-branch`);
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

  describe('versionOverride', function () {
    beforeEach(async function () {
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
    });

    it('can override version', async function() {
      let versionOverride = this.stub().callsFake(async ({ cwd }) => {
        await fs.promises.writeFile(path.join(cwd, 'test-version'), '');
      });

      await release({
        versionOverride,
      });

      expect(versionOverride).to.be.calledOnce;
      expect(versionOverride.args[0][0]?.cwd).to.equal(path.join(tmpPath, 'packages/package-a'));
      expect(versionOverride.args[0][0]?.originalVersion).to.be.a('function');
    });
  });

  describe('commit', function () {
    beforeEach(async function () {
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
    });

    it('calls precommit before staging', async function() {
      let gitStatusPercelain;

      let preCommitCallback = this.stub().callsFake(async () => {
        gitStatusPercelain = await git(['status', '--porcelain'], { cwd: tmpPath });
      });

      let spy = this.spy(execa, 'command');

      let precommit = 'git status --porcelain';

      await release({
        preCommitCallback,
        scripts: {
          precommit,
        },
      });

      expect(gitStatusPercelain).to.startWith(' M ');

      let { stdout } = await spy.withArgs(precommit).firstCall.returnValue;

      expect(stdout).to.startWith(' M ');
    });
  });

  describe('push', function () {
    beforeEach(async function () {
      await cloneRemote({
        localPath: tmpPath,
      });

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
    });

    async function assertPush({ cwd, assertNotPushed = false }) {
      let { stdout: branchName } = await execa('git', ['branch', '--show-current'], { cwd });
      let { stdout: localHead } = await execa('git', ['rev-parse', branchName], { cwd });
      let { stdout: remoteHead } = await execa('git', ['rev-parse', `origin/${branchName}`], { cwd });

      if (assertNotPushed) {
        expect(remoteHead).to.not.equal(localHead);
      } else {
        expect(remoteHead).to.equal(localHead);
      }
    }

    it('can override push', async function() {
      let pushOverride = this.spy();

      await release({
        shouldPush: true,
        pushOverride,
      });

      expect(pushOverride).to.be.calledOnce;
      expect(pushOverride.args[0][0]?.cwd).to.equal(tmpPath);
      expect(pushOverride.args[0][0]?.originalPush).to.be.a('function');
      expect(pushOverride.args[0][0]?.dryRun).to.equal(false);

      assertPush({ cwd: tmpPath, assertNotPushed: true });
    });

    it('can call originalPush', async function() {
      let pushOverride = this.stub().callsFake(({ originalPush }) => originalPush());

      await release({
        shouldPush: true,
        pushOverride,
      });

      assertPush({ cwd: tmpPath });
    });
  });

  describe('publish', function () {
    beforeEach(async function () {
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
    });

    it('can override publish', async function() {
      let publishOverride = this.spy();

      await release({
        shouldPublish: true,
        publishOverride,
      });

      expect(publishOverride).to.be.calledOnce;
      expect(publishOverride.args[0][0]?.cwd).to.equal(path.join(tmpPath, 'packages/package-a'));
      expect(publishOverride.args[0][0]?.originalPublish).to.be.a('function');
      expect(publishOverride.args[0][0]?.distTag).to.equal('latest');
      expect(publishOverride.args[0][0]?.dryRun).to.equal(false);
    });
  });

  describe('dry run', function() {
    const dryRun = true;

    let gitCopyPath;

    beforeEach(async function() {
      await cloneRemote({
        localPath: tmpPath,
      });

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
        ['precommit test', { cwd: tmpPath, shell: true }],
        ['git', ['commit', '-m', "'chore(release): @scope/package-a@1.1.0,root@1.0.1'"], { cwd: tmpPath }],
        ['postcommit test', { cwd: tmpPath, shell: true }],
        ['pretag test', { cwd: tmpPath, shell: true }],
        ['git', ['tag', '-a', '@scope/package-a@1.1.0', '-m', '@scope/package-a@1.1.0'], { cwd: tmpPath }],
        ['git', ['tag', '-a', 'root@1.0.1', '-m', 'root@1.0.1'], { cwd: tmpPath }],
        ['posttag test', { cwd: tmpPath, shell: true }],
        ['git', ['push', '--follow-tags', '--atomic', '--dry-run'], { cwd: tmpPath }],
        ['npm', ['publish', '--tag', 'latest', '--dry-run'], { cwd: path.join(tmpPath, 'packages/package-a') }],
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
        ['git', ['commit', '-m', "'chore(release): @scope/package-a@1.1.0,root@1.0.1'"], { cwd: tmpPath }],
        ['git', ['tag', '-a', '@scope/package-a@1.1.0', '-m', '@scope/package-a@1.1.0'], { cwd: tmpPath }],
        ['git', ['tag', '-a', 'root@1.0.1', '-m', 'root@1.0.1'], { cwd: tmpPath }],
        ['git', ['push', '--follow-tags', '--atomic', '--dry-run'], { cwd: tmpPath }],
        ['npm', ['publish', '--tag', 'latest', '--dry-run'], { cwd: path.join(tmpPath, 'packages/package-a') }],
      ]);

      expect(pushOverride.args).to.match([[this.match({ dryRun: true })]]);
      expect(publishOverride.args).to.match([[this.match({ dryRun: true })]]);
    });
  });

  describe('pnpm', function() {
    afterEach(function() {
      expect(updateYarnLockfile).to.not.have.been.called;
    });

    it('ignores if lockfile missing', async function() {
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
          'workspaces': [
            'packages/*',
          ],
        }),
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

      await release();

      expect(updatePnpmLockfile).to.not.have.been.called;
    });

    it('updates lockfile if present', async function() {
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
          'workspaces': [
            'packages/*',
          ],
        }),
        'pnpm-lock.yaml': '',
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

      await release();

      expect(updatePnpmLockfile).to.have.been.calledOnce;
    });
  });

  describe('yarn', function() {
    afterEach(function() {
      expect(updatePnpmLockfile).to.not.have.been.called;
    });

    it('ignores if lockfile missing', async function() {
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
          'workspaces': [
            'packages/*',
          ],
        }),
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

      await release();

      expect(updateYarnLockfile).to.not.have.been.called;
    });

    it('updates lockfile if present', async function() {
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
          'workspaces': [
            'packages/*',
          ],
        }),
        'yarn.lock': '',
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'fix: foo'], { cwd: tmpPath });

      await release();

      expect(updateYarnLockfile).to.have.been.calledOnce;
    });
  });
});
