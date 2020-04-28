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

async function changed({
  cwd = process.cwd(),
  silent,
} = {}) {
  let workspaceCwd = (await execa('git', ['rev-parse', '--show-toplevel'], { cwd })).stdout;

  let workspaceMeta = await buildDepGraph(workspaceCwd);

  let packagesWithChanges = await buildChangeGraph(workspaceMeta);

  let _changed = [];

  for (let { dag } of packagesWithChanges) {
    let name = await arePathsTheSame(dag.cwd, workspaceCwd) ? dag.packageName : path.basename(dag.cwd);

    if (!silent) {
      console.log(name);
    }
    _changed.push(name);
  }

  return _changed;
}

module.exports = changed;
