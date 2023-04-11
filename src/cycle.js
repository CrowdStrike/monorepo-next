'use strict';

const dependencyTypes = require('./dependency-types');

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
  branch,
  visitedNodes,
  cycles,
  shouldDetectDevDependencies,
}) {
  let { packageName } = _package;

  let hasVisitedNode = visitedNodes.has(packageName);

  if (hasVisitedNode) {
    let i = findGroupInBranchByPackageName(branch, packageName);

    let isCycle = i !== -1;

    let existingGroup = {
      dependencyType,
      dependencyRange,
      packageName,
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

  let newBranch = [...branch, {
    dependencyType,
    dependencyRange,
    packageName,
  }];

  visitedNodes.add(packageName);

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
  let visitedNodes = new Set();
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
