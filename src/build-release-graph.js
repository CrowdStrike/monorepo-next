'use strict';

const { promisify } = require('util');
const conventionalRecommendedBump = promisify(require('conventional-recommended-bump'));

async function getReleaseType(packageName, cwd) {
  let tagPrefix = `${packageName}@`;

  let originalCwd = process.cwd();

  let myReleaseType;
  try {
    process.chdir(cwd);

    myReleaseType = (await conventionalRecommendedBump({
      // preset: require('standard-version/defaults').preset,
      preset: require('standard-version/lib/preset-loader')({}),
      path: cwd,
      tagPrefix,
    })).releaseType;
  } finally {
    process.chdir(originalCwd);
  }

  return myReleaseType;
}

const orderedReleaseTypes = ['patch', 'minor', 'major'];

function isReleaseTypeLessThan(type1, type2) {
  return orderedReleaseTypes.indexOf(type1) < orderedReleaseTypes.indexOf(type2);
}

function crawlDag(dag, releaseTypeTrackingByPackage, incomingReleaseType) {
  let currentReleaseType = releaseTypeTrackingByPackage[dag.packageName];

  if (!currentReleaseType) {
    // no version in package.json
    return;
  }

  if (!incomingReleaseType) {
    incomingReleaseType = currentReleaseType;
  }

  if (dag.dependencyType === 'dependencies' && isReleaseTypeLessThan(currentReleaseType, incomingReleaseType)) {
    currentReleaseType = incomingReleaseType;
    releaseTypeTrackingByPackage[dag.packageName] = currentReleaseType;
  }

  for (let node of dag.dependents) {
    if (!node.isPackage || node.isCycle) {
      continue;
    }

    crawlDag(node, releaseTypeTrackingByPackage, currentReleaseType);
  }
}

async function buildReleaseGraph(packagesWithChanges) {
  let releaseTrees = [];

  let releaseTypeTrackingByPackage = {};

  packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
    return dag.packageName && dag.version;
  });

  for (let { dag } of packagesWithChanges) {
    releaseTypeTrackingByPackage[dag.packageName] = await getReleaseType(dag.packageName, dag.cwd);
  }

  for (let { dag } of packagesWithChanges) {
    crawlDag(dag, releaseTypeTrackingByPackage);

    releaseTrees.push(dag);
  }

  return {
    releaseTypes: releaseTypeTrackingByPackage,
    releaseTrees,
  };
}

module.exports = buildReleaseGraph;
