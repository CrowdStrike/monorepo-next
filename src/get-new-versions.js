'use strict';

const {
  getWorkspaceCwd,
} = require('./git');
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const _buildReleaseGraph = require('./build-release-graph');
const semver = require('semver');

const { builder } = require('../bin/commands/release');

async function getNewVersions({
  cwd = process.cwd(),
  shouldBumpInRangeDependencies = builder['bump-in-range-dependencies'].default,
  shouldInheritGreaterReleaseType = builder['inherit-greater-release-type'].default,
  fromCommit,
  sinceBranch,
  cached,
}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph(workspaceCwd);

  let packagesWithChanges = await buildChangeGraph({
    workspaceMeta,
    fromCommit,
    sinceBranch,
    cached,
  });

  let releaseTrees = await _buildReleaseGraph({
    packagesWithChanges,
    shouldBumpInRangeDependencies,
    shouldInheritGreaterReleaseType,
  });

  let newVersions = {};

  for (let {
    name,
    canBumpVersion,
    oldVersion,
    releaseType,
  } of releaseTrees) {
    if (!canBumpVersion) {
      continue;
    }

    let newVersion = semver.inc(oldVersion, releaseType);

    newVersions[name] = newVersion;
  }

  return newVersions;
}

module.exports = getNewVersions;
