'use strict';

const dependencyTypes = require('./dependency-types');
const { collectPackages } = require('./build-dep-graph');

function doesDependOnPackage(_package, packageName, {
  shouldIncludeDevDependencies,
}) {
  for (let dependencyType of dependencyTypes) {
    if (!shouldIncludeDevDependencies && dependencyType === 'devDependencies') {
      return;
    }

    if (Object.keys(_package[dependencyType]).includes(packageName)) {
      return {
        dependencyType,
        dependencyRange: _package[dependencyType][packageName],
      };
    }
  }
}

function thirdPass({
  workspaceMeta,
  group,
  branch,
  visitedNodes,
  shouldIncludeDevDependencies,
}) {
  let currentPackageName = group.node.packageName;

  visitedNodes[currentPackageName] = group.node;

  for (let _package of collectPackages(workspaceMeta)) {
    if (_package.packageName === currentPackageName) {
      continue;
    }

    let {
      dependencyType,
      dependencyRange,
    } = doesDependOnPackage(_package, currentPackageName, {
      shouldIncludeDevDependencies,
    }) || {};

    if (dependencyType) {
      let parent = group;

      let visitedNode = visitedNodes[_package.packageName];

      if (visitedNode) {
        let isCycle = branch.includes(_package.packageName);

        group.node.dependents.push({
          parent,
          dependencyType,
          dependencyRange,
          isCycle,
          node: visitedNode,
        });

        continue;
      }

      let {
        newGroup,
        newBranch,
      } = createPackageNode({
        workspaceMeta,
        packageName: _package.packageName,
        dependencyType,
        dependencyRange,
        parent,
        branch,
      });

      group.node.dependents.push(newGroup);

      if (group.node.isPackage) {
        thirdPass({
          workspaceMeta,
          group: newGroup,
          branch: newBranch,
          visitedNodes,
          shouldIncludeDevDependencies,
        });
      }
    }
  }
}

function createPackageNode({
  workspaceMeta,
  packageName,
  dependencyType,
  dependencyRange,
  parent,
  branch,
}) {
  let _package = workspaceMeta.packages[packageName];

  let node = {
    isPackage: !!(_package && !_package.isPrivate),
    cwd: _package ? _package.cwd : workspaceMeta.cwd,
    packageName,
    version: _package ? _package.version : workspaceMeta.version,
    dependents: [],
  };

  let group = {
    parent,
    dependencyType,
    dependencyRange,
    isCycle: false,
    node,
  };

  let newBranch = [...branch, packageName].filter(Boolean);

  return {
    newGroup: group,
    newBranch,
  };
}

function buildDAG(workspaceMeta, packageName, {
  shouldIncludeDevDependencies = true,
} = {}) {
  let {
    newGroup,
    newBranch,
  } = createPackageNode({
    workspaceMeta,
    packageName,
    branch: [],
  });

  let visitedNodes = {};

  thirdPass({
    workspaceMeta,
    group: newGroup,
    branch: newBranch,
    visitedNodes,
    shouldIncludeDevDependencies,
  });

  return newGroup;
}

module.exports = buildDAG;
