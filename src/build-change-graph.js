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
  let changedFiles = union(committedChanges, dirtyChanges);

  return changedFiles;
}

function crawlDag(dag, packagesWithChanges) {
  for (let node of dag.dependents) {
    if (packagesWithChanges[node.packageName]) {
      continue;
    }

    packagesWithChanges[node.packageName] = {
      changedFiles: [],
      dag: node,
    };

    if (node.dependencyType !== 'devDependencies') {
      crawlDag(node, packagesWithChanges);
    }
  }
}

async function buildChangeGraph({
  workspaceMeta,
  fromCommit,
  sinceBranch,
  cached,
}) {
  let packagesWithChanges = {};

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
        sinceBranchCommit = await getCommonAncestor('HEAD', sinceBranch, {
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

    let changedFiles = await getPackageChangedFiles({
      tagCommit,
      currentCommit: 'HEAD',
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

    if (newFiles.length) {
      let dag = buildDAG(workspaceMeta, _package.packageName);

      packagesWithChanges[dag.packageName] = {
        changedFiles: newFiles,
        dag,
      };
    }
  }

  for (let { dag } of Object.values(packagesWithChanges)) {
    crawlDag(dag, packagesWithChanges);
  }

  return Object.values(packagesWithChanges);
}

module.exports = buildChangeGraph;
