'use strict';

const {
  getWorkspaceCwd,
} = require('./git');
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const buildReleaseGraph = require('./build-release-graph');
const semver = require('semver');

const { builder } = require('../bin/commands/release');

async function getNewVersions({
  cwd = process.cwd(),
  shouldBumpInRangeDependencies = builder['bump-in-range-dependencies'].default,
  shouldInheritGreaterReleaseType = builder['inherit-greater-release-type'].default,
  shouldExcludeDevChanges = builder['exclude-dev-changes'].default,
  fromCommit,
  sinceBranch,
  cached,
}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({ workspaceCwd });

  let packagesWithChanges = await buildChangeGraph({
    workspaceMeta,
    fromCommit,
    sinceBranch,
    cached,
  });

  let releaseTrees = await buildReleaseGraph({
    packagesWithChanges,
    shouldBumpInRangeDependencies,
    shouldInheritGreaterReleaseType,
    shouldExcludeDevChanges,
  });

  let newVersions = {};

  for (let {
    name,
    shouldBumpVersion,
    oldVersion,
    releaseType,
  } of releaseTrees) {
    if (!shouldBumpVersion) {
      continue;
    }

    let newVersion = semver.inc(oldVersion, releaseType);

    newVersions[name] = {
      oldVersion,
      releaseType,
      newVersion,
    };
  }

  return newVersions;
}

module.exports = getNewVersions;
