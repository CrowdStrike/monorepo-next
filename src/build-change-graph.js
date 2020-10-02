'use strict';

const buildDAG = require('./build-dag');
const execa = require('execa');
const {
  getCommitAtTag,
  getFirstCommit,
  getLinesFromOutput,
  isCommitAncestorOf,
  getCommonAncestor,
} = require('./git');

function union(a, b) {
  return [...new Set([...a, ...b])];
}

async function getCommitSinceLastRelease(_package) {
  let version = _package.version;

  let matches = version.match(/(.*)-detached.*/);

  if (matches) {
    version = matches[1];
  }

  let tag = `${_package.packageName}@${version}`;

  try {
    return await getCommitAtTag(tag, _package.cwd);
  } catch (err) {
    if (err.stderr.includes(`fatal: ambiguous argument '${tag}': unknown revision or path not in the working tree.`)) {
      return await getFirstCommit(_package.cwd);
    } else {
      throw err;
    }
  }
}

async function getPackageChangedFiles(tagCommit, currentCommit, _package) {
  let isAncestor = await isCommitAncestorOf(tagCommit, currentCommit, _package.cwd);

  let olderCommit;
  let newerCommit;
  if (isAncestor) {
    olderCommit = tagCommit;
    newerCommit = currentCommit;
  } else {
    olderCommit = currentCommit;
    newerCommit = tagCommit;
  }

  let committedChanges = (await execa('git', ['diff', '--name-only', `${olderCommit}...${newerCommit}`, _package.cwd], { cwd: _package.cwd })).stdout;
  committedChanges = getLinesFromOutput(committedChanges);
  let dirtyChanges = (await execa('git', ['status', '--porcelain', _package.cwd], { cwd: _package.cwd })).stdout;
  dirtyChanges = getLinesFromOutput(dirtyChanges).map(line => line.substr(3));
  return union(committedChanges, dirtyChanges);
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

let cachedChangedFiles = {};

async function buildChangeGraph({
  workspaceMeta,
  fromCommit,
  sinceBranch,
  cached,
}) {
  let packagesWithChanges = {};

  let alreadyVisitedFiles = [];

  for (let _package of [...Object.values(workspaceMeta.packages), workspaceMeta]) {
    if (!_package.packageName || !_package.version) {
      continue;
    }

    let tagCommit;
    if (fromCommit) {
      tagCommit = fromCommit;
    } else if (sinceBranch) {
      tagCommit = await getCommonAncestor('HEAD', sinceBranch, _package.cwd);
    } else {
      tagCommit = await getCommitSinceLastRelease(_package);
    }

    if (!cachedChangedFiles[_package.cwd]) {
      cachedChangedFiles[_package.cwd] = {};
    }

    let cachedPackageChangedFiles = cachedChangedFiles[_package.cwd];

    let changedFiles;
    if (cached && cachedPackageChangedFiles[tagCommit]) {
      changedFiles = cachedPackageChangedFiles[tagCommit];
    } else {
      changedFiles = await getPackageChangedFiles(tagCommit, 'HEAD', _package);
    }
    if (cached) {
      cachedPackageChangedFiles[tagCommit] = changedFiles;
    }

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
