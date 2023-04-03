'use strict';

const dependencyTypes = require('./dependency-types');

function createPackageNode({
  packageName,
  dependencyType,
  dependencyRange,
  parent,
  branch,
}) {
  let group = {
    parent,
    dependencyType,
    dependencyRange,
    isCycle: false,
    packageName,
  };

  let newBranch = [...branch, group].filter(Boolean);

  return {
    newGroup: group,
    newBranch,
  };
}

function findGroupInBranchByPackageName(branch, packageName) {
  let _i = -1;

  for (let i = 0; i < branch.length; i++) {
    if (branch[i].packageName === packageName) {
      _i = i;

      break;
    }
  }

  return _i;
}

function _getCycles({
  packages,
  _package,
  dependencyType,
  dependencyRange,
  parent,
  branch,
  visitedNodes,
  cycles,
  shouldDetectDevDependencies,
}) {
  let visitedNode = visitedNodes[_package.packageName];

  if (visitedNode) {
    let i = findGroupInBranchByPackageName(branch, _package.packageName);

    let isCycle = i !== -1;

    let existingGroup = {
      parent,
      dependencyType,
      dependencyRange,
      isCycle,
      packageName: visitedNode,
    };

    if (isCycle) {
      let newBranch = [...branch.slice(i), existingGroup];

      let cycle = newBranch.map(({ dependencyType, packageName }) => {
        return [dependencyType, packageName];
      });

      cycles[cycle.flat().slice(1).join(' < ')] = existingGroup;
    }

    return;
  }

  let {
    newGroup,
    newBranch,
  } = createPackageNode({
    packageName: _package.packageName,
    dependencyType,
    dependencyRange,
    parent,
    branch,
  });

  visitedNodes[_package.packageName] = newGroup.packageName;

  for (let dependencyType of dependencyTypes) {
    if (!shouldDetectDevDependencies && dependencyType === 'devDependencies') {
      continue;
    }

    let dependencies = _package[dependencyType];

    for (let packageName of Object.keys(dependencies).sort()) {
      let dependencyRange = dependencies[packageName];
      let _package = packages[packageName];

      _getCycles({
        packages,
        _package,
        dependencyType,
        dependencyRange,
        parent: newGroup,
        branch: newBranch,
        visitedNodes,
        cycles,
        shouldDetectDevDependencies,
      });
    }
  }
}

function getCycles(workspaceMeta, {
  shouldDetectDevDependencies,
} = {}) {
  let cycles = {};
  let visitedNodes = {};
  let { packages } = workspaceMeta;

  for (let packageName of Object.keys(packages).sort()) {
    let _package = packages[packageName];

    _getCycles({
      packages,
      _package,
      branch: [],
      visitedNodes,
      cycles,
      shouldDetectDevDependencies,
    });
  }

  return Object.keys(cycles).sort();
}

Object.assign(module.exports, {
  getCycles,
});
