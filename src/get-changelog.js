'use strict';

const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const buildReleaseGraph = require('./build-release-graph');
const semver = require('semver');

const defaults = require('standard-version/defaults');

const { builder } = require('../bin/commands/release');

async function getChangelog({
  cwd = process.cwd(),
  shouldBumpInRangeDependencies = builder['bump-in-range-dependencies'].default,
  shouldInheritGreaterReleaseType = builder['inherit-greater-release-type'].default,
}) {
  let { name, version } = require(path.join(cwd, 'package'));

  let tagPrefix = `${name}@`;

  let workspaceCwd = (await exec('git rev-parse --show-toplevel', { cwd })).stdout.trim();

  let workspaceMeta = await buildDepGraph(workspaceCwd);

  let packagesWithChanges = await buildChangeGraph(workspaceMeta);

  packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
    return dag.packageName === name && dag.version;
  });

  if (!packagesWithChanges.length) {
    let changelog = await _getChangelog({
      cwd,
      tagPrefix,
      version,
      releaseCount: 2,
    });

    return changelog;
  }

  let releaseTrees = await buildReleaseGraph({
    packagesWithChanges,
    shouldBumpInRangeDependencies,
    shouldInheritGreaterReleaseType,
  });

  let releaseTree = releaseTrees.find(releaseTree => releaseTree.name === name);

  let newVersion = semver.inc(version, releaseTree.releaseType);

  let changelog = await _getChangelog({
    cwd,
    tagPrefix,
    version: newVersion,
  });

  return changelog;
}

async function _getChangelog({
  cwd,
  tagPrefix,
  version,
  releaseCount,
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
    { merges: null, path: cwd },
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
