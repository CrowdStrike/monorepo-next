'use strict';

const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const path = require('path');
const fs = { ...require('fs'), ...require('fs').promises };
const {
  getWorkspaceCwd,
} = require('./git');
const minimatch = require('minimatch');

const { builder } = require('../bin/commands/changed-files');

// stupid Mac /private symlink means normal equality won't work
async function arePathsTheSame(path1, path2) {
  return await fs.realpath(path1) === await fs.realpath(path2);
}

async function changedFiles({
  cwd = process.cwd(),
  shouldOnlyIncludeReleasable = builder['only-include-releasable'].default,
  shouldExcludeDevChanges = builder['exclude-dev-changes'].default,
  fromCommit,
  fromCommitIfNewer,
  sinceBranch,
  cached,
  packages = [],
  exts = [],
  globs = [],
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

  let changedFiles = [];

  let isPackageCwd = !await arePathsTheSame(cwd, workspaceCwd);

  for (let {
    changedFiles: _changedFiles,
    dag,
  } of packagesWithChanges) {
    if (packages.length && !packages.includes(path.basename(dag.cwd))) {
      continue;
    }

    if (isPackageCwd && !await arePathsTheSame(dag.cwd, cwd)) {
      continue;
    }

    for (let file of _changedFiles) {
      let isMatch = false;

      if (!exts.length && !globs.length) {
        isMatch = true;
      } else if (exts.some(ext => file.endsWith(`.${ext}`))) {
        isMatch = true;
      } else if (globs.some(glob => minimatch(file, glob))) {
        isMatch = true;
      }

      if (isMatch) {
        changedFiles.push(file);
      }
    }
  }

  return changedFiles;
}

module.exports = changedFiles;
Object.assign(module.exports, {
  arePathsTheSame,
});
