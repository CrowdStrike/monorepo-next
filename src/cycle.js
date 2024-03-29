'use strict';

const dependencyTypes = require('./dependency-types');

function sortCycle(cycle) {
  let alpha = cycle[0];
  let index = 0;

  for (let i = 2; i < cycle.length - 2; i += 2) {
    let name = cycle[i];

    if (name < alpha) {
      alpha = name;
      index = i;
    }
  }

  let shifts = index / 2;

  for (let i = 0; i < shifts; i++) {
    cycle = [...cycle.slice(2), cycle[1], cycle[2]];
  }

  return cycle;
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
  let cycleTips = new Set();

  let hasVisitedNode = visitedNodes.has(packageName);

  if (hasVisitedNode) {
    return cycleTips;
  }

  let isCycle = branch.has(packageName);

  if (isCycle) {
    let existingGroup = {
      dependencyType,
      dependencyRange,
      packageName,
    };

    let newBranch = [...[...branch.values()].slice([...branch.keys()].indexOf(packageName)), existingGroup];

    let cycle = newBranch.map(({ dependencyType, packageName }) => {
      return [dependencyType, packageName];
    });

    cycles.add(sortCycle(cycle.flat().slice(1)).join(' < '));

    cycleTips.add(packageName);

    return cycleTips;
  }

  let newGroup = {
    dependencyType,
    dependencyRange,
    packageName,
  };

  let newBranch = new Map([...branch, [packageName, newGroup]]);

  for (let dependencyType of dependencyTypes) {
    if (!shouldDetectDevDependencies && dependencyType === 'devDependencies') {
      continue;
    }

    let dependencies = _package[dependencyType];

    for (let packageName of Object.keys(dependencies).sort()) {
      let dependencyRange = dependencies[packageName];
      let _package = packages[packageName];

      cycleTips = new Set([...cycleTips, ..._getCycles({
        packages,
        _package,
        dependencyType,
        dependencyRange,
        branch: newBranch,
        visitedNodes,
        cycles,
        shouldDetectDevDependencies,
      })]);
    }
  }

  cycleTips.delete(packageName);

  if (!cycleTips.size) {
    visitedNodes.add(packageName);
  }

  return cycleTips;
}

function getCycles(workspaceMeta, {
  shouldDetectDevDependencies,
} = {}) {
  let cycles = new Set();
  let visitedNodes = new Set();
  let { packages } = workspaceMeta;

  for (let packageName of Object.keys(packages).sort()) {
    let _package = packages[packageName];

    _getCycles({
      packages,
      _package,
      branch: new Map(),
      visitedNodes,
      cycles,
      shouldDetectDevDependencies,
    });
  }

  return [...cycles].sort();
}

Object.assign(module.exports, {
  getCycles,
});
