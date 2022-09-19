'use strict';

const buildDepGraph = require('./build-dep-graph');
const { getCycles } = require('./cycle');
const {
  getWorkspaceCwd,
} = require('./git');

const { builder } = require('../bin/commands/cycles');

async function detectCircularReferences({
  cwd = process.cwd(),
  shouldDetectDevDependencies = builder['detect-dev-dependencies'].default,
} = {}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({ workspaceCwd });

  let cycles = getCycles(workspaceMeta, {
    shouldDetectDevDependencies,
  });

  return cycles;
}

module.exports = detectCircularReferences;
