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
  fromCommit,
  fromCommitIfNewer,
  sinceBranch,
  cached,
} = {}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({ workspaceCwd });

  let packagesWithChanges = await buildChangeGraph({
    workspaceMeta,
    shouldOnlyIncludeReleasable,
    shouldExcludeDevChanges,
    fromCommit,
    fromCommitIfNewer,
    sinceBranch,
    cached,
  });

  let _changed = packagesWithChanges.map(({ dag }) => dag.packageName);

  return _changed;
}

module.exports = changed;
