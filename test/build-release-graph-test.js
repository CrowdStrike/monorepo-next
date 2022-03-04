'use strict';

const { describe, it, setUpSinon } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const buildDepGraph = require('../src/build-dep-graph');
const buildChangeGraph = require('../src/build-change-graph');
const buildReleaseGraph = require('../src/build-release-graph');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { matchPath } = require('./helpers/matchers');
const { gitInit } = require('git-fixtures');
const path = require('path');

describe(buildReleaseGraph, function() {
  this.timeout(5e3);

  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpSinon();

  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit();
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

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = false;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'patch',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.1.0',
          },
        ],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
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

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = false;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
  });

  it('inherits greater release type when lesser', async function() {
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

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.0.0',
          },
        ],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
  });

  it('inherits greater release type when no changes and bump in-range versions', async function() {
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
    await execa('git', ['commit', '-m', 'foo'], { cwd: tmpPath });
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

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.1.0',
          },
        ],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
  });

  it('ignores greater release type when no changes and ignore in-range versions', async function() {
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
    await execa('git', ['commit', '-m', 'foo'], { cwd: tmpPath });
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

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
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

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = false;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'patch',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.0.0',
          },
        ],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
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

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.1.0',
          },
        ],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
  });

  it('ignores a dependency that doesn\'t change', async function() {
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
    await execa('git', ['tag', '@scope/package-a@1.0.0'], { cwd: tmpPath });
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
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
  });

  it('tracks newly out-of-range', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-b': {
          'package.json': stringifyJson({
            'private': true,
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
    await execa('git', ['commit', '-m', 'foo'], { cwd: tmpPath });
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
    await execa('git', ['commit', '-m', 'feat: foo\n\nBREAKING CHANGE: foo'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = false;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'major',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'patch',
        shouldBumpVersion: true,
        shouldPublish: false,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^2.0.0',
          },
        ],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
  });

  it('updates optional deps', async function() {
    await execa('git', ['tag', '@scope/package-c@1.0.0'], { cwd: tmpPath });

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'optionalDependencies': {
              '@scope/package-a': '^1.0.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '1.0.0',
            'optionalDependencies': {
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

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
      {
        name: '@scope/package-c',
        cwd: matchPath('/packages/package-c'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.1.0',
          },
        ],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.1.0',
          },
        ],
      },
    ]));
  });

  describe('shouldExcludeDevChanges', function() {
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

      let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

      let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

      packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
        return dag.node.packageName && dag.node.version;
      });

      let releaseTrees = await buildReleaseGraph({
        packagesWithChanges,
        shouldExcludeDevChanges: true,
      });

      expect(releaseTrees).to.match(this.match([
        {
          name: '@scope/package-a',
          cwd: matchPath('/packages/package-a'),
          oldVersion: '1.0.0',
          releaseType: 'minor',
          shouldBumpVersion: true,
          shouldPublish: true,
          dependencies: [],
          devDependencies: [],
          optionalDependencies: [],
        },
        {
          name: '@scope/package-b',
          cwd: matchPath('/packages/package-b'),
          oldVersion: '1.0.0',
          releaseType: 'patch',
          shouldBumpVersion: false,
          shouldPublish: false,
          dependencies: [],
          devDependencies: [
            {
              name: '@scope/package-a',
              newRange: '1.1.0',
            },
          ],
          optionalDependencies: [],
        },
      ]));
    });

    it('bumps version when dev dep changes when option is off', async function() {
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
              'devDependencies': {
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

      let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

      let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

      packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
        return dag.node.packageName && dag.node.version;
      });

      let releaseTrees = await buildReleaseGraph({
        packagesWithChanges,
        shouldExcludeDevChanges: false,
      });

      expect(releaseTrees).to.match(this.match([
        {
          name: '@scope/package-a',
          cwd: matchPath('/packages/package-a'),
          oldVersion: '1.0.0',
          releaseType: 'minor',
          shouldBumpVersion: true,
          shouldPublish: true,
          dependencies: [],
          devDependencies: [],
          optionalDependencies: [],
        },
        {
          name: '@scope/package-b',
          cwd: matchPath('/packages/package-b'),
          oldVersion: '1.0.0',
          releaseType: 'patch',
          shouldBumpVersion: true,
          shouldPublish: true,
          dependencies: [],
          devDependencies: [
            {
              name: '@scope/package-a',
              newRange: '1.1.0',
            },
          ],
          optionalDependencies: [],
        },
        {
          name: '@scope/package-c',
          cwd: matchPath('/packages/package-c'),
          oldVersion: '1.0.0',
          releaseType: 'patch',
          shouldBumpVersion: true,
          shouldPublish: true,
          dependencies: [],
          devDependencies: [
            {
              name: '@scope/package-b',
              newRange: '1.0.1',
            },
          ],
          optionalDependencies: [],
        },
      ]));
    });
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

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = false;

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(this.match(releaseTrees => {
      return !releaseTrees.some(tree => {
        return tree.name === 'root';
      });
    }));
  });

  it('doesn\'t calculate release type when patch is guaranteed', async function() {
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
            'dependencies': {
              '@scope/package-a': '1.0.0',
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
          'index.js': 'console.log()',
        },
      },
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph({ workspaceCwd: tmpPath });

    let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.node.packageName && dag.node.version;
    });

    let getReleaseType = this.spy(buildReleaseGraph, 'getReleaseType');

    let releaseTrees = await buildReleaseGraph({
      packagesWithChanges,
    });

    expect(getReleaseType.args).to.deep.equal([
      [
        '@scope/package-a',
        path.join(tmpPath, 'packages/package-a'),
      ],
    ]);

    expect(releaseTrees).to.match(this.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [],
        devDependencies: [],
        optionalDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'patch',
        shouldBumpVersion: true,
        shouldPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '1.1.0',
          },
        ],
        devDependencies: [],
        optionalDependencies: [],
      },
    ]));
  });
});
