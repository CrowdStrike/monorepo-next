'use strict';

const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const {
  getWorkspaceCwd,
} = require('./git');

const { builder } = require('../bin/commands/changed');

async function changed({
  cwd = process.cwd(),
  shouldOnlyIncludeReleasable = builder['only-include-releasable'].default,
  shouldExcludeDevChanges = builder['exclude-dev-changes'].default,
  shouldExcludeDeleted = builder['exclude-deleted'].default,
  fromCommit,
  fromCommitIfNewer,
  toCommit,
  sinceBranch,
  cached,
} = {}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({ workspaceCwd });

  let packagesWithChanges = await buildChangeGraph({
    workspaceMeta,
    shouldOnlyIncludeReleasable,
    shouldExcludeDevChanges,
    shouldExcludeDeleted,
    fromCommit,
    fromCommitIfNewer,
    toCommit,
    sinceBranch,
    cached,
  });

  let _changed = packagesWithChanges.map(({ dag }) => dag.node.packageName);

  return _changed;
}

module.exports = changed;
