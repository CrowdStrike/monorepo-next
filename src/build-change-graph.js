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
const { isSubDir } = require('./path');
const { getChangedReleasableFiles } = require('./releasable');
const Set = require('superset');
const { loadPackageConfig } = require('./config');
const path = require('path');

async function getPackageChangedFiles({
  fromCommit,
  toCommit,
  packageCwd,
  options,
}) {
  // Be careful you don't accidentally use `...` instead of `..`.
  // `...` finds the merge-base and uses that instead of `fromCommit`.
  // https://stackoverflow.com/a/60496462
  let committedChanges = await git(['diff', '--name-only', `${fromCommit}..${toCommit}`, packageCwd], options);

  committedChanges = getLinesFromOutput(committedChanges);

  let dirtyChanges = await git(['status', '--porcelain', packageCwd, '-u'], options);

  dirtyChanges = getLinesFromOutput(dirtyChanges).map(line => line.substr(3));

  let changedFiles = Array.from(new Set(committedChanges).union(dirtyChanges));

  return changedFiles;
}

function crawlDag(dag, packagesWithChanges) {
  for (let group of dag.node.dependents) {
    if (packagesWithChanges[group.node.packageName]) {
      continue;
    }

    packagesWithChanges[group.node.packageName] = {
      changedFiles: [],
      changedReleasableFiles: [],
      dag: group,
    };

    if (group.dependencyType !== 'devDependencies') {
      crawlDag(group, packagesWithChanges);
    }
  }
}

async function buildChangeGraph({
  workspaceMeta,
  shouldOnlyIncludeReleasable,
  shouldExcludeDevChanges,
  fromCommit,
  fromCommitIfNewer,
  toCommit = 'HEAD',
  sinceBranch,
  cached,
}) {
  let packagesWithChanges = {};
  let sinceBranchCommit;

  let packagePaths = Object.values(workspaceMeta.packages).map(({ cwd }) => {
    return path.relative(workspaceMeta.cwd, cwd);
  });

  for (let _package of collectPackages(workspaceMeta)) {
    if (!_package.packageName || !_package.version) {
      continue;
    }

    let nextConfig = loadPackageConfig(_package.cwd);

    if (!nextConfig.shouldBumpVersion) {
      continue;
    }

    let _fromCommit;
    if (fromCommit) {
      _fromCommit = fromCommit;
    } else if (sinceBranch) {
      if (!sinceBranchCommit) {
        sinceBranchCommit = await getCommonAncestor(toCommit, sinceBranch, {
          cwd: workspaceMeta.cwd,
          cached,
        });
      }
      _fromCommit = sinceBranchCommit;
    } else {
      _fromCommit = await getCommitSinceLastRelease(_package, {
        cwd: workspaceMeta.cwd,
        cached,
      });
    }

    if (fromCommitIfNewer) {
      let [
        isNewerThanTagCommit,
        isInSameBranch,
      ] = await Promise.all([
        isCommitAncestorOf(_fromCommit, fromCommitIfNewer, {
          cwd: workspaceMeta.cwd,
          cached,
        }),
        isCommitAncestorOf(fromCommitIfNewer, toCommit, {
          cwd: workspaceMeta.cwd,
          cached,
        }),
      ]);

      if (isNewerThanTagCommit && isInSameBranch) {
        _fromCommit = fromCommitIfNewer;
      }
    }

    let changedFiles = await getPackageChangedFiles({
      fromCommit: _fromCommit,
      toCommit,
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
        return !packagePaths.some((packagePath) => {
          return isSubDir(packagePath, file);
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
      fromCommit: _fromCommit,
    });

    if (shouldOnlyIncludeReleasable && !changedReleasableFiles.length) {
      continue;
    }

    let dag = buildDAG(workspaceMeta, _package.packageName);

    packagesWithChanges[_package.packageName] = {
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
