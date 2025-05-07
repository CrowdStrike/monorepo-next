'use strict';

const dependencyTypes = require('./dependency-types');
const { collectPackages } = require('./build-dep-graph');

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

function thirdPass({
  workspaceMeta,
  group,
  branch,
  visitedNodes,
}) {
  let currentPackageName = group.node.packageName;

  visitedNodes[currentPackageName] = group.node;

  let longestBranch = branch;

  for (let _package of collectPackages(workspaceMeta)) {
    if (_package.packageName === currentPackageName) {
      continue;
    }

    let {
      dependencyType,
      dependencyRange,
    } = doesDependOnPackage(_package, currentPackageName) ?? {};

    if (dependencyType) {
      let parent = group;

      let visitedNode = visitedNodes[_package.packageName];

      if (visitedNode) {
        let isCycle = branch.includes(_package.packageName);

        let {
          newGroup,
        } = createPackageNode({
          parent,
          dependencyType,
          dependencyRange,
          isCycle,
          node: visitedNode,
        });

        group.node.dependents.push(newGroup);

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

      if (dependencyType === 'devDependencies') {
        continue;
      }

      // We don't want to check if it's private here because
      // you could have a chain of private packages, and you
      // want to bump them all the way down.
      // if (group.node.isPackage) {
      let _longestBranch = thirdPass({
        workspaceMeta,
        group: newGroup,
        branch: newBranch,
        visitedNodes,
      });

      if (_longestBranch.length > longestBranch.length) {
        longestBranch = _longestBranch;
      }
      // }
    }
  }

  return longestBranch;
}

function createPackageNode({
  workspaceMeta,
  packageName,
  dependencyType,
  dependencyRange,
  parent,
  branch = [],
  node,
  isCycle = false,
}) {
  let newNode;

  if (node) {
    newNode = node;
  } else {
    let _package = workspaceMeta.packages[packageName] ?? workspaceMeta;

    newNode = {
      isPackage: !_package.isPrivate,
      cwd: _package.cwd,
      packageName,
      version: _package.version,
      dependents: [],
    };
  }

  let longestChain;

  if (isCycle) {
    longestChain = Infinity;
  } else {
    longestChain = (parent?.longestChain ?? 0) + 1;
  }

  let group = {
    parent,
    dependencyType,
    dependencyRange,
    isCycle,
    node: newNode,
    longestChain,
  };

  let newBranch = [...branch, packageName].filter(Boolean);

  return {
    newGroup: group,
    newBranch,
  };
}

function buildDAG(workspaceMeta, packageName) {
  let {
    newGroup,
    newBranch,
  } = createPackageNode({
    workspaceMeta,
    packageName,
  });

  let visitedNodes = {};

  let longestBranch = thirdPass({
    workspaceMeta,
    group: newGroup,
    branch: newBranch,
    visitedNodes,
  });

  return {
    dag: newGroup,
    longestBranch,
  };
}

module.exports = buildDAG;
