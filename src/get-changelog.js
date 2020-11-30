'use strict';

const path = require('path');
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const buildReleaseGraph = require('./build-release-graph');
const semver = require('semver');
const {
  getWorkspaceCwd,
} = require('./git');

const defaults = require('standard-version/defaults');

const { builder } = require('../bin/commands/release');

async function getChangelog({
  cwd = process.cwd(),
  shouldBumpInRangeDependencies = builder['bump-in-range-dependencies'].default,
  shouldInheritGreaterReleaseType = builder['inherit-greater-release-type'].default,
  releaseCount = 1,
  fromCommit,
  cached,
}) {
  let { name, version } = require(path.join(cwd, 'package'));

  let tagPrefix = `${name}@`;

  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph(workspaceCwd);

  let packagesWithChanges = await buildChangeGraph({
    workspaceMeta,
    fromCommit,
    cached,
  });

  packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
    return dag.packageName && dag.version;
  });

  let releaseTrees = await buildReleaseGraph({
    packagesWithChanges,
    shouldBumpInRangeDependencies,
    shouldInheritGreaterReleaseType,
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
  let changelog = '';
  let context = { version };
  let changelogStream = require('conventional-changelog')(
    {
      preset: require('standard-version/lib/preset-loader')(defaults),
      tagPrefix,
      releaseCount,
      pkg: { path: cwd },
      path: cwd,
    },
    context,
    {
      merges: null,
      path: cwd,
      from,
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
