'use strict';

const buildDAG = require('./build-dag');
const {
  git,
  getLinesFromOutput,
  isCommitAncestorOf,
  getCommonAncestor,
  getCommitSinceLastRelease,
} = require('./git');
const { collectPackages } = require('./build-dep-graph');
const minimatch = require('minimatch');
const { getChangedReleasableFiles } = require('./releasable');
const {
  union,
} = require('./set');

async function getPackageChangedFiles({
  tagCommit,
  currentCommit,
  packageCwd,
  options,
}) {
  let isAncestor = await isCommitAncestorOf(tagCommit, currentCommit, options);

  let olderCommit;
  let newerCommit;
  if (isAncestor) {
    olderCommit = tagCommit;
    newerCommit = currentCommit;
  } else {
    olderCommit = currentCommit;
    newerCommit = tagCommit;
  }

  let committedChanges = await git(['diff', '--name-only', `${olderCommit}...${newerCommit}`, packageCwd], options);
  committedChanges = getLinesFromOutput(committedChanges);
  let dirtyChanges = await git(['status', '--porcelain', packageCwd], options);
  dirtyChanges = getLinesFromOutput(dirtyChanges).map(line => line.substr(3));
  let changedFiles = Array.from(union(committedChanges, dirtyChanges));

  return changedFiles;
}

function crawlDag(dag, packagesWithChanges) {
  for (let node of dag.dependents) {
    if (packagesWithChanges[node.packageName]) {
      continue;
    }

    packagesWithChanges[node.packageName] = {
      changedFiles: [],
      changedReleasableFiles: [],
      dag: node,
    };

    if (node.dependencyType !== 'devDependencies') {
      crawlDag(node, packagesWithChanges);
    }
  }
}

async function buildChangeGraph({
  workspaceMeta,
  shouldOnlyIncludeReleasable,
  shouldExcludeDevChanges,
  fromCommit,
  fromCommitIfNewer,
  sinceBranch,
  cached,
}) {
  let packagesWithChanges = {};
  let currentCommit = 'HEAD';
  let sinceBranchCommit;

  for (let _package of collectPackages(workspaceMeta)) {
    if (!_package.packageName || !_package.version) {
      continue;
    }

    let tagCommit;
    if (fromCommit) {
      tagCommit = fromCommit;
    } else if (sinceBranch) {
      if (!sinceBranchCommit) {
        sinceBranchCommit = await getCommonAncestor(currentCommit, sinceBranch, {
          cwd: workspaceMeta.cwd,
          cached,
        });
      }
      tagCommit = sinceBranchCommit;
    } else {
      tagCommit = await getCommitSinceLastRelease(_package, {
        cwd: workspaceMeta.cwd,
        cached,
      });
    }

    if (fromCommitIfNewer) {
      let [
        isNewerThanTagCommit,
        isInSameBranch,
      ] = await Promise.all([
        isCommitAncestorOf(tagCommit, fromCommitIfNewer, {
          cwd: workspaceMeta.cwd,
          cached,
        }),
        isCommitAncestorOf(fromCommitIfNewer, currentCommit, {
          cwd: workspaceMeta.cwd,
          cached,
        }),
      ]);

      if (isNewerThanTagCommit && isInSameBranch) {
        tagCommit = fromCommitIfNewer;
      }
    }

    let changedFiles = await getPackageChangedFiles({
      tagCommit,
      currentCommit,
      packageCwd: _package.cwd,
      options: {
        cwd: workspaceMeta.cwd,
        cached,
      },
    });

    let newFiles = changedFiles;

    // remove package changes from the workspace root's changed files
    if (_package.cwd === workspaceMeta.cwd) {
      newFiles = newFiles.filter(file => {
        return !workspaceMeta.packagesGlobs.some(glob => {
          return minimatch(file, `${glob}/**`, { dot: true });
        });
      });
    }

    if (!newFiles.length) {
      continue;
    }

    let changedReleasableFiles = await getChangedReleasableFiles({
      changedFiles: newFiles,
      packageCwd: _package.cwd,
      workspacesCwd: workspaceMeta.cwd,
      shouldExcludeDevChanges,
      tagCommit,
    });

    if (shouldOnlyIncludeReleasable && !changedReleasableFiles.length) {
      continue;
    }

    let dag = buildDAG(workspaceMeta, _package.packageName);

    packagesWithChanges[dag.packageName] = {
      changedFiles: newFiles,
      changedReleasableFiles,
      dag,
    };
  }

  for (let { dag, changedReleasableFiles } of Object.values(packagesWithChanges)) {
    if (!changedReleasableFiles.length) {
      continue;
    }

    crawlDag(dag, packagesWithChanges);
  }

  return Object.values(packagesWithChanges);
}

module.exports = buildChangeGraph;
