'use strict';

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const buildDAG = require('./build-dag');
const execa = require('execa');

async function getCurrentCommit(cwd) {
  return (await exec('git rev-parse HEAD', { cwd })).stdout.trim();
}

async function getCommitSinceLastRelease(_package) {
  let version = _package.version;

  let matches = version.match(/(.*)-detached.*/);

  if (matches) {
    version = matches[1];
  }

  let tag = `${_package.packageName}@${version}`;

  return (await exec(`git rev-list -1 ${tag}`, { cwd: _package.cwd })).stdout.trim();
}

async function getPackageChangedFiles(tagCommit, currentCommit, _package) {
  let lines = (await execa('git', ['diff', '--name-only', `${tagCommit}...${currentCommit}`, _package.cwd], { cwd: _package.cwd })).stdout;
  return lines.split(/\r?\n/).filter(Boolean);
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

async function buildChangeGraph(workspaceMeta) {
  let packagesWithChanges = {};

  let currentCommit = await getCurrentCommit(workspaceMeta.cwd);

  let alreadyVisitedFiles = [];

  for (let _package of [...Object.values(workspaceMeta.packages), workspaceMeta]) {
    if (!_package.packageName || !_package.version) {
      continue;
    }

    let tagCommit = await getCommitSinceLastRelease(_package);

    let changedFiles = await getPackageChangedFiles(tagCommit, currentCommit, _package);

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
