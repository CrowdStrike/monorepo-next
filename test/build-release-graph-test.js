'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const buildDepGraph = require('../src/build-dep-graph');
const buildChangeGraph = require('../src/build-change-graph');
const buildReleaseGraph = require('../src/build-release-graph');
const { promisify } = require('util');
const tmpDir = promisify(require('tmp').dir);
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const exec = promisify(require('child_process').exec);
const sinon = require('sinon');
const path = require('path');

function matchPath(p) {
  return sinon.match(path.normalize(p));
}

describe(buildReleaseGraph, function() {
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

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.packageName && dag.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = false;

    let releaseTrees = await buildReleaseGraph({
      workspaceMeta,
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(sinon.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'patch',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.1.0',
          },
        ],
        devDependencies: [],
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

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.packageName && dag.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = false;

    let releaseTrees = await buildReleaseGraph({
      workspaceMeta,
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(sinon.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [],
      },
    ]));
  });

  it('inherits greater release type when lesser', async function() {
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

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.packageName && dag.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      workspaceMeta,
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(sinon.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.0.0',
          },
        ],
        devDependencies: [],
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

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "foo"', { cwd: tmpPath });
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

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.packageName && dag.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      workspaceMeta,
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(sinon.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.1.0',
          },
        ],
        devDependencies: [],
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

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "foo"', { cwd: tmpPath });
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

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.packageName && dag.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      workspaceMeta,
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(sinon.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [],
      },
    ]));
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

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.packageName && dag.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = false;

    let releaseTrees = await buildReleaseGraph({
      workspaceMeta,
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(sinon.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'patch',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.0.0',
          },
        ],
        devDependencies: [],
      },
    ]));
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

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.packageName && dag.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      workspaceMeta,
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(sinon.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [
          {
            name: '@scope/package-a',
            newRange: '^1.1.0',
          },
        ],
        devDependencies: [],
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

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "fix: foo"', { cwd: tmpPath });
    await exec('git tag @scope/package-a@1.0.0', { cwd: tmpPath });
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
    });

    await exec('git add .', { cwd: tmpPath });
    await exec('git commit -m "feat: foo"', { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.packageName && dag.version;
    });

    let shouldBumpInRangeDependencies = true;
    let shouldInheritGreaterReleaseType = true;

    let releaseTrees = await buildReleaseGraph({
      workspaceMeta,
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(sinon.match([
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'minor',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [],
      },
    ]));
  });

  it('tracks newly out-of-range', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '1.0.0',
            'devDependencies': {
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
    await exec('git commit -m "foo"', { cwd: tmpPath });
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
    await exec('git commit -m "feat: foo\n\nBREAKING CHANGE: foo"', { cwd: tmpPath });

    let workspaceMeta = await buildDepGraph(tmpPath);

    let packagesWithChanges = await buildChangeGraph(workspaceMeta);

    packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
      return dag.packageName && dag.version;
    });

    let shouldBumpInRangeDependencies = false;
    let shouldInheritGreaterReleaseType = false;

    let releaseTrees = await buildReleaseGraph({
      workspaceMeta,
      packagesWithChanges,
      shouldBumpInRangeDependencies,
      shouldInheritGreaterReleaseType,
    });

    expect(releaseTrees).to.match(sinon.match([
      {
        name: '@scope/package-a',
        cwd: matchPath('/packages/package-a'),
        oldVersion: '1.0.0',
        releaseType: 'major',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [],
      },
      {
        name: '@scope/package-b',
        cwd: matchPath('/packages/package-b'),
        oldVersion: '1.0.0',
        releaseType: 'patch',
        canBumpVersion: true,
        canPublish: true,
        dependencies: [],
        devDependencies: [
          {
            name: '@scope/package-a',
            newRange: '^2.0.0',
          },
        ],
      },
    ]));
  });
});
