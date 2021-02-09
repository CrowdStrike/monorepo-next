'use strict';

const {
  getWorkspaceCwd,
  getCommitSinceLastRelease,
} = require('./git');
const buildDepGraph = require('./build-dep-graph');
const { collectPackages } = buildDepGraph;

async function getPackage({
  cwd,
  packageName,
}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({ workspaceCwd });

  let packages = collectPackages(workspaceMeta);

  let _package = packages.find(_package => _package.packageName === packageName);

  return _package;
}

async function getLatestReleaseCommit({
  cwd,
  packageName,
}) {
  let _package = await getPackage({
    cwd,
    packageName,
  });

  let commit = await getCommitSinceLastRelease(_package, { cwd: _package.cwd });

  return commit;
}

module.exports = getLatestReleaseCommit;
