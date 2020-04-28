'use strict';

const { promisify } = require('util');
const execa = require('execa');
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const path = require('path');
const realpath = promisify(require('fs').realpath);

// stupid Mac /private symlink means normal equality won't work
async function arePathsTheSame(path1, path2) {
  return await realpath(path1) === await realpath(path2);
}

async function changedFiles({
  cwd = process.cwd(),
  silent,
  packages = [],
  ext,
} = {}) {
  let workspaceCwd = (await execa('git', ['rev-parse', '--show-toplevel'], { cwd })).stdout;

  let workspaceMeta = await buildDepGraph(workspaceCwd);

  let packagesWithChanges = await buildChangeGraph(workspaceMeta);

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
      if (ext && !file.endsWith(ext)) {
        continue;
      }

      if (!silent) {
        console.log(file);
      }
      changedFiles.push(file);
    }
  }

  return changedFiles;
}

module.exports = changedFiles;
