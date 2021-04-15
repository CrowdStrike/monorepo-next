'use strict';

const { describe, it, setUpSinon } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const buildDepGraph = require('../src/build-dep-graph');
const buildChangeGraph = require('../src/build-change-graph');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');
const { getCurrentCommit } = require('./helpers/git');
const { replaceJsonFile } = require('../src/fs');
const path = require('path');

describe(buildChangeGraph, function() {
  this.timeout(5e3);

  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpSinon();

  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit();
  });

  it('tracks package changes', async function() {
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/index.js',
        ],
        changedReleasableFiles: [
          'packages/package-a/index.js',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
  });

  it('ignores package without changes', async function() {
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

    await execa('git', ['commit', '--allow-empty', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.deep.equal([]);
  });

  it('tracks dirty package changes', async function() {
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/index.js',
        ],
        changedReleasableFiles: [
          'packages/package-a/index.js',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
  });

  it('tracks workspace with a version', async function() {
    fixturify.writeSync(tmpPath, {
      'package.json': stringifyJson({
        'name': 'workspace-root',
        'version': '1.0.0',
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['tag', 'workspace-root@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'index.js': 'console.log()',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'index.js',
        ],
        changedReleasableFiles: [
          'index.js',
        ],
        dag: this.match({
          packageName: 'workspace-root',
        }),
      },
    ]));
  });

  it('ignores workspace without a version', async function() {
    fixturify.writeSync(tmpPath, {
      'package.json': stringifyJson({
        'name': 'workspace-root',
        'workspaces': [
          'packages/*',
        ],
      }),
      'index.js': 'console.log()',
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.deep.equal([]);
  });

  it('accepts a package without a version tag', async function() {
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/index.js',
          'packages/package-a/package.json',
        ],
        changedReleasableFiles: [
          'packages/package-a/index.js',
          'packages/package-a/package.json',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
  });

  it('accepts an arbitrary commit to calculate difference', async function() {
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      fromCommit: commit,
    });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/index.js',
        ],
        changedReleasableFiles: [
          'packages/package-a/index.js',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
  });

  it('can calulate difference in reverse order using an arbitrary commit', async function() {
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let oldCommit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let commit = await getCurrentCommit(tmpPath);

    await execa('git', ['reset', '--hard', oldCommit], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      fromCommit: commit,
    });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/index.js',
        ],
        changedReleasableFiles: [
          'packages/package-a/index.js',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
  });

  it('can calulate difference since branch point', async function() {
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['checkout', '-b', 'test-branch'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/index.js',
          'packages/package-a/package.json',
        ],
        changedReleasableFiles: [
          'packages/package-a/index.js',
          'packages/package-a/package.json',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));

    packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      sinceBranch: 'master',
    });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/index.js',
        ],
        changedReleasableFiles: [
          'packages/package-a/index.js',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
  });

  it('can cache the results', async function() {
    let packagesWithChanges;

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
            'name': 'my-app-1',
            'version': '1.0.0',
          }),
        },
      },
      'package.json': stringifyJson({
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'my-app-1@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let cachedPackagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      cached: true,
    });

    expect(cachedPackagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/changed.txt',
        ],
        changedReleasableFiles: [
          'packages/package-a/changed.txt',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));

    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-1': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      cached: true,
    });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/changed.txt',
        ],
        changedReleasableFiles: [
          'packages/package-a/changed.txt',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));

    packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      fromCommit: commit,
      cached: true,
    });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/my-app-1/changed.txt',
        ],
        changedReleasableFiles: [
          'packages/my-app-1/changed.txt',
        ],
        dag: this.match({
          packageName: 'my-app-1',
        }),
      },
    ]));

    packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
    });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/my-app-1/changed.txt',
        ],
        changedReleasableFiles: [
          'packages/my-app-1/changed.txt',
        ],
        dag: this.match({
          packageName: 'my-app-1',
        }),
      },
      {
        changedFiles: [
          'packages/package-a/changed.txt',
        ],
        changedReleasableFiles: [
          'packages/package-a/changed.txt',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
  });

  it('can cache by commit', async function() {
    let packagesWithChanges;

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
            'name': 'my-app-1',
            'version': '1.0.0',
          }),
        },
      },
      'package.json': stringifyJson({
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let firstCommit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let cachedPackagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      fromCommit: firstCommit,
      cached: true,
    });

    expect(cachedPackagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/changed.txt',
        ],
        changedReleasableFiles: [
          'packages/package-a/changed.txt',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));

    let secondCommit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app-1': {
          'changed.txt': 'test',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      fromCommit: secondCommit,
      cached: true,
    });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/my-app-1/changed.txt',
        ],
        changedReleasableFiles: [
          'packages/my-app-1/changed.txt',
        ],
        dag: this.match({
          packageName: 'my-app-1',
        }),
      },
    ]));

    packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      fromCommit: firstCommit,
      cached: true,
    });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/package-a/changed.txt',
        ],
        changedReleasableFiles: [
          'packages/package-a/changed.txt',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));

    packagesWithChanges = await buildChangeGraph({
      workspaceMeta,
      cached: true,
    });

    expect(packagesWithChanges).to.match(this.match([
      {
        changedFiles: [
          'packages/my-app-1/changed.txt',
          'packages/my-app-1/package.json',
        ],
        changedReleasableFiles: [
          'packages/my-app-1/changed.txt',
          'packages/my-app-1/package.json',
        ],
        dag: this.match({
          packageName: 'my-app-1',
        }),
      },
      {
        changedFiles: [
          'packages/package-a/changed.txt',
          'packages/package-a/package.json',
        ],
        changedReleasableFiles: [
          'packages/package-a/changed.txt',
          'packages/package-a/package.json',
        ],
        dag: this.match({
          packageName: '@scope/package-a',
        }),
      },
    ]));
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
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
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.match(this.match(packagesWithChanges => {
      return !packagesWithChanges.some(pkg => {
        return pkg.dag.packageName === 'root';
      });
    }));
  });

  it('ignores old child package changes in root package', async function() {
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['tag', 'root@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.match(this.match(packagesWithChanges => {
      return !packagesWithChanges.some(pkg => {
        return pkg.dag.packageName === 'root';
      });
    }));
  });

  it('ignores dotfile child package changes in root package', async function() {
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
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
    await execa('git', ['tag', 'root@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          '.index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    expect(packagesWithChanges).to.match(this.match(packagesWithChanges => {
      return !packagesWithChanges.some(pkg => {
        return pkg.dag.packageName === 'root';
      });
    }));
  });

  describe('ignoring dev changes', function() {
    it('changed files ignored in npm publish do not cascade', async function() {
      fixturify.writeSync(tmpPath, {
        'packages': {
          'package-a': {
            'package.json': stringifyJson({
              'name': '@scope/package-a',
              'version': '1.0.0',
              'files': ['src'],
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
          'workspaces': [
            'packages/*',
          ],
        }),
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
      await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
      await execa('git', ['tag', '@scope/package-b@1.0.0'], { cwd: tmpPath });

      fixturify.writeSync(tmpPath, {
        'packages': {
          'package-a': {
            'index.js': 'console.log()',
          },
        },
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

      let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

      let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

      expect(packagesWithChanges).to.match(this.match([
        {
          changedFiles: [
            'packages/package-a/index.js',
          ],
          changedReleasableFiles: [],
          dag: this.match({
            packageName: '@scope/package-a',
          }),
        },
      ]));

      expect(packagesWithChanges).to.match(this.match(packagesWithChanges => {
        return !packagesWithChanges.some(pkg => {
          return pkg.dag.packageName === '@scope/package-b';
        });
      }));
    });

    it('removed files still show up in published files', async function() {
      fixturify.writeSync(tmpPath, {
        'packages': {
          'package-a': {
            'index.js': 'console.log()',
            'package.json': stringifyJson({
              'name': '@scope/package-a',
              'version': '1.0.0',
              'files': ['index.js'],
            }),
          },
        },
        'package.json': stringifyJson({
          'workspaces': [
            'packages/*',
          ],
        }),
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
      await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

      fixturify.writeSync(tmpPath, {
        'packages': {
          'package-a': {
            'index.js': null,
          },
        },
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

      let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

      let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

      expect(packagesWithChanges).to.match(this.match([
        {
          changedFiles: [
            'packages/package-a/index.js',
          ],
          changedReleasableFiles: [
            'packages/package-a/index.js',
          ],
          dag: this.match({
            packageName: '@scope/package-a',
          }),
        },
      ]));
    });

    it('can ignore non production dependencies', async function() {
      fixturify.writeSync(tmpPath, {
        'packages': {
          'package-a': {
            'package.json': stringifyJson({
              'name': '@scope/package-a',
              'version': '1.0.0',
              'devDependencies': {
                'external-package': '1.0.0',
              },
            }),
          },
        },
        'package.json': stringifyJson({
          'workspaces': [
            'packages/*',
          ],
        }),
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });
      await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });

      await replaceJsonFile(path.join(tmpPath, 'packages/package-a/package.json'), json => {
        json.devDependencies['external-package'] = '2.0.0';
      });

      await execa('git', ['add', '.'], { cwd: tmpPath });
      await execa('git', ['commit', '-m', 'test'], { cwd: tmpPath });

      let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

      let packagesWithChanges = await buildChangeGraph({
        workspaceMeta,
        shouldExcludeDevChanges: true,
      });

      expect(packagesWithChanges).to.match(this.match([
        {
          changedFiles: [
            'packages/package-a/package.json',
          ],
          changedReleasableFiles: [],
          dag: this.match({
            packageName: '@scope/package-a',
          }),
        },
      ]));
    });
  });
});
