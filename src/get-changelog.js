'use strict';

const path = require('path');
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const buildReleaseGraph = require('./build-release-graph');
const semver = require('semver');
const {
  getWorkspaceCwd,
  isCommitAncestorOf,
} = require('./git');
const readJson = require('./json').read;

const defaults = require('commit-and-tag-version/defaults');

const { builder } = require('../bin/commands/release');

async function getChangelog({
  cwd = process.cwd(),
  shouldBumpInRangeDependencies = builder['bump-in-range-dependencies'].default,
  shouldInheritGreaterReleaseType = builder['inherit-greater-release-type'].default,
  shouldExcludeDevChanges = builder['exclude-dev-changes'].default,
  shouldValidateDependencyVisibility = builder['validate-dependency-visibility'].default,
  releaseCount = 1,
  fromCommit,
  cached,
}) {
  let { name, version } = await readJson(path.join(cwd, 'package.json'));

  let tagPrefix = `${name}@`;

  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({ workspaceCwd });

  let packagesWithChanges = await buildChangeGraph({
    workspaceMeta,
    shouldExcludeDevChanges,
    fromCommit,
    cached,
  });

  packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
    return dag.node.packageName && dag.node.version;
  });

  let releaseTrees = await buildReleaseGraph({
    packagesWithChanges,
    shouldBumpInRangeDependencies,
    shouldInheritGreaterReleaseType,
    shouldExcludeDevChanges,
    shouldValidateDependencyVisibility,
  });

  let releaseTree = releaseTrees.find(releaseTree => releaseTree.name === name);

  if (!releaseTree) {
    let changelog = await _getChangelog({
      cwd,
      tagPrefix,
      version,
      releaseCount: releaseCount + 1,
    });

    return changelog;
  }

  let newVersion = semver.inc(version, releaseTree.releaseType);

  // There is currently no way to get a good/correct changelog out of a revert,
  // or in other words, a commit range in reverse order.
  if (fromCommit) {
    let isAncestor = await isCommitAncestorOf(fromCommit, 'HEAD', {
      cwd: workspaceCwd,
      cached,
    });

    if (!isAncestor) {
      newVersion = version;
    }
  }

  let changelog = await _getChangelog({
    cwd,
    tagPrefix,
    version: newVersion,
    releaseCount,
    from: fromCommit,
  });

  return changelog;
}

async function _getChangelog({
  cwd,
  tagPrefix,
  version,
  releaseCount,
  from,
}) {
  const conventionalChangelog = require('conventional-changelog');

  let changelog = '';
  let context = { version };
  let changelogStream = conventionalChangelog(
    {
      preset: require('commit-and-tag-version/lib/preset-loader')(defaults),
      tagPrefix,
      releaseCount,
      pkg: { path: path.join(cwd, 'package.json') },
      path: cwd,
    },
    context,
    {
      merges: null,
      path: cwd,
      ...from ? { from } : {},
    },
    null,
    null,
    { cwd },
  );

  changelogStream.on('data', (buffer) => {
    changelog += buffer.toString();
  });

  await new Promise((resolve, reject) => {
    changelogStream.on('error', reject);
    changelogStream.on('end', resolve);
  });

  return changelog;
}

module.exports = getChangelog;
