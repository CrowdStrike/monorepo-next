'use strict';

const buildDAG = require('./build-dag');
const execa = require('execa');
const {
  getLinesFromOutput,
  isCommitAncestorOf,
  getCommonAncestor,
  getCommitSinceLastRelease,
} = require('./git');

function union(a, b) {
  return [...new Set([...a, ...b])];
}

let cachedChangedFiles = {};

async function getPackageChangedFiles({
  tagCommit,
  currentCommit,
  packageCwd,
  cached,
}) {
  if (!cachedChangedFiles[packageCwd]) {
    cachedChangedFiles[packageCwd] = {};
  }

  let cachedPackageChangedFiles = cachedChangedFiles[packageCwd];

  let changedFiles;

  if (cached && cachedPackageChangedFiles[tagCommit]) {
    changedFiles = cachedPackageChangedFiles[tagCommit];
  } else {
    let isAncestor = await isCommitAncestorOf(tagCommit, currentCommit, packageCwd);

    let olderCommit;
    let newerCommit;
    if (isAncestor) {
      olderCommit = tagCommit;
      newerCommit = currentCommit;
    } else {
      olderCommit = currentCommit;
      newerCommit = tagCommit;
    }

    let committedChanges = (await execa('git', ['diff', '--name-only', `${olderCommit}...${newerCommit}`, packageCwd], { cwd: packageCwd })).stdout;
    committedChanges = getLinesFromOutput(committedChanges);
    let dirtyChanges = (await execa('git', ['status', '--porcelain', packageCwd], { cwd: packageCwd })).stdout;
    dirtyChanges = getLinesFromOutput(dirtyChanges).map(line => line.substr(3));
    changedFiles = union(committedChanges, dirtyChanges);
  }

  if (cached) {
    cachedPackageChangedFiles[tagCommit] = changedFiles;
  }

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

  let alreadyVisitedFiles = [];

  let sinceBranchCommit;

  for (let _package of [...Object.values(workspaceMeta.packages), workspaceMeta]) {
    if (!_package.packageName || !_package.version) {
      continue;
    }

    let tagCommit;
    if (fromCommit) {
      tagCommit = fromCommit;
    } else if (sinceBranch) {
      if (!sinceBranchCommit) {
        sinceBranchCommit = await getCommonAncestor('HEAD', sinceBranch, workspaceMeta.cwd);
      }
      tagCommit = sinceBranchCommit;
    } else {
      tagCommit = await getCommitSinceLastRelease(_package);
    }

    let changedFiles = await getPackageChangedFiles({
      tagCommit,
      currentCommit: 'HEAD',
      packageCwd: _package.cwd,
      cached,
    });

    let newFiles = [];

    // remove package changes from the workspace root's changed files
    for (let file of changedFiles) {
      if (alreadyVisitedFiles.includes(file)) {
        continue;
      }

      alreadyVisitedFiles.push(file);
      newFiles.push(file);
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
