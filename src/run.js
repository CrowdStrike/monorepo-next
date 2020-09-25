'use strict';

const execa = require('execa');
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const {
  getWorkspaceCwd,
} = require('./git');

async function run({
  cwd = process.cwd(),
  silent,
  args,
}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph(workspaceCwd);

  let packagesWithChanges = await buildChangeGraph({ workspaceMeta });

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
