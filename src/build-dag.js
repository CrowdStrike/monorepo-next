'use strict';

const dependencyTypes = require('./dependency-types');

function doesDependOnPackage(_package, packageName) {
  for (let dependencyType of dependencyTypes) {
    if (Object.keys(_package[dependencyType]).includes(packageName)) {
      return {
        dependencyType,
        dependencyRange: _package[dependencyType][packageName],
      };
    }
  }
}

function thirdPass(workspaceMeta, dag) {
  let currentPackageName = dag.packageName;

  for (let _package of [...Object.values(workspaceMeta.packages), workspaceMeta]) {
    if (_package.packageName === currentPackageName) {
      continue;
    }

    let {
      dependencyType,
      dependencyRange,
    } = doesDependOnPackage(_package, currentPackageName) || {};

    if (dependencyType) {
      let node = createPackageNode({
        workspaceMeta,
        packageName: _package.packageName,
        dependencyType,
        dependencyRange,
        dag,
      });
      dag.dependents.push(node);
      if (node.isPackage && !node.isCycle) {
        thirdPass(workspaceMeta, node);
      }
    }
  }
}

function createPackageNode({
  workspaceMeta,
  packageName,
  dependencyType,
  dependencyRange,
  dag,
}) {
  let _package = workspaceMeta.packages[packageName];
  let node = {
    isPackage: !!(_package && !_package.isPrivate),
    cwd: _package ? _package.cwd : workspaceMeta.cwd,
    packageName,
    version: _package ? _package.version : workspaceMeta.version,
    ...dependencyType ? { dependencyType } : {},
    ...typeof dependencyRange === 'string' ? { dependencyRange } : {},
    branch: [...dag.branch, dag.packageName].filter(Boolean),
    ..._package ? { isCycle: dag.branch.includes(packageName) } : {},
  };
  if (!node.isCycle) {
    node.dependents = [];
  }
  return node;
}

function buildDAG(workspaceMeta, packageName) {
  let dag = createPackageNode({
    workspaceMeta,
    packageName,
    dag: {
      branch: [],
    },
  });

  thirdPass(workspaceMeta, dag);

  return dag;
}

module.exports = buildDAG;
