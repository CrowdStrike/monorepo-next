'use strict';

const execa = require('execa');
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const {
  getWorkspaceCwd,
} = require('./git');

const { builder } = require('../bin/commands/run');

async function run({
  cwd = process.cwd(),
  shouldOnlyIncludeReleasable = builder['only-include-releasable'].default,
  silent,
  args,
}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({ workspaceCwd });

  let packagesWithChanges = await buildChangeGraph({
    workspaceMeta,
    shouldOnlyIncludeReleasable,
  });

  let stdout = '';
  let stderr = '';

  for (let { dag } of packagesWithChanges) {
    let cp = execa('yarn', args, { cwd: dag.cwd });

    if (!silent) {
      cp.stdout.pipe(process.stdout);
      cp.stderr.pipe(process.stderr);
    }

    cp = await cp;

    stdout += cp.stdout;
    stderr += cp.stderr;
  }

  return {
    stdout,
    stderr,
  };
}

module.exports = run;
