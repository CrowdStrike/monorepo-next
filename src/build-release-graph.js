'use strict';

const conventionalRecommendedBump = require('conventional-recommended-bump');
const path = require('path');
const {
  read: readJson,
} = require('./json');
const { trackNewVersion } = require('./version');
const semver = require('semver');
const dependencyTypes = require('./dependency-types');
const { loadPackageConfig } = require('./config');
const debug = require('./debug');
const { createSyncLogger, createAsyncLogger } = require('./log');

const defaultReleaseType = 'patch';

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

function isReleaseTypeInRange(version, type, range) {
  return semver.satisfies(semver.inc(version, type), range);
}

let shouldVersionBumpSymbol = Symbol('shouldVersionBump');
let nextConfigSymbol = Symbol('nextConfig');

async function init({
  dag,
  releaseTrees,
}) {
  let {
    isPackage,
    packageName: name,
    cwd,
  } = dag.node;

  let packageJsonPath = path.join(cwd, 'package.json');

  let { version } = await readJson(packageJsonPath);

  if (version) {
    let matches = version.match(/(.*)-detached.*/);

    if (matches) {
      version = matches[1];
    }
  }

  let nextConfig = await loadPackageConfig(cwd);

  let canBumpVersion = !!(version && name);
  let canPublish = isPackage;

  let shouldVersionBump = false;

  let releaseTree = {
    oldVersion: version,
    releaseType: defaultReleaseType,
    cwd,
    name,
    get [nextConfigSymbol]() {
      return nextConfig;
    },
    [shouldVersionBumpSymbol]() {
      shouldVersionBump = true;
    },
    get shouldBumpVersion() {
      return canBumpVersion && shouldVersionBump;
    },
    get shouldPublish() {
      return canPublish && this.shouldBumpVersion;
    },
  };

  releaseTrees[name] = releaseTree;

  return releaseTree;
}

async function firstPass({
  releaseTrees,
  packagesWithChanges,
}) {
  for (let { dag, changedReleasableFiles } of packagesWithChanges) {
    if (!changedReleasableFiles.length) {
      continue;
    }

    let {
      packageName: name,
      cwd,
    } = dag.node;

    let releaseTree = await init({ dag, releaseTrees });

    if (releaseTree[nextConfigSymbol].shouldBumpVersion) {
      releaseTree.releaseType = await module.exports.getReleaseType(name, cwd);
    }
  }
}

async function secondPass({
  releaseTrees,
  packagesWithChanges,
  shouldBumpInRangeDependencies,
  shouldInheritGreaterReleaseType,
  shouldExcludeDevChanges,
}) {
  function shouldInit({
    dag,
    parent,
  }) {
    let isDevDep = dag.dependencyType === 'devDependencies';

    if (dag.node.isPackage && shouldInheritGreaterReleaseType && !isDevDep && shouldBumpInRangeDependencies) {
      return true;
    } else if (!isReleaseTypeInRange(parent.oldVersion, parent.releaseType, dag.dependencyRange)) {
      return true;
    } else if (shouldBumpInRangeDependencies) {
      return true;
    }

    return false;
  }

  let visitedNodes = new Set();

  for (let { dag, changedReleasableFiles } of packagesWithChanges) {
    if (!changedReleasableFiles.length) {
      continue;
    }

    await (async function crawlDag({
      dag,
      parent,
    }) {
      if (visitedNodes.has(dag.node.packageName)) {
        return;
      }

      let releaseTree = releaseTrees[dag.node.packageName];
      let doesPackageHaveChanges = !!releaseTree;

      if (!doesPackageHaveChanges) {
        if (!shouldInit({
          dag,
          parent,
        })) {
          return;
        }

        releaseTree = await init({ dag, releaseTrees });

        let isDevDep = dag.dependencyType === 'devDependencies';
        let shouldVersionBump = !(shouldExcludeDevChanges && isDevDep);

        if (!shouldVersionBump) {
          return;
        }
      }

      visitedNodes.add(dag.node.packageName);

      if (!releaseTree[nextConfigSymbol].shouldBumpVersion) {
        return;
      }

      releaseTree[shouldVersionBumpSymbol]();

      for (let group of dag.node.dependents) {
        if (group.isCycle) {
          continue;
        }

        await crawlDag({
          dag: group,
          parent: releaseTrees[dag.node.packageName],
        });
      }
    })({
      dag,
    });
  }
}

function thirdPass({
  releaseTrees,
  packagesWithChanges,
  shouldInheritGreaterReleaseType,
}) {
  for (let { dag, changedReleasableFiles } of packagesWithChanges) {
    if (!changedReleasableFiles.length) {
      continue;
    }

    (function crawlDag({
      dag,
      parent,
    }) {
      let current = releaseTrees[dag.node.packageName];

      if (!current?.shouldBumpVersion) {
        return;
      }

      let currentReleaseType = current.releaseType;

      if (parent) {
        let incomingReleaseType = parent.releaseType;

        if (currentReleaseType === incomingReleaseType) {
          // either already visited at this release type, or already at the lowest
          // either way, no upgrades needed
          return;
        }

        let isCurrentGreaterThan = !isReleaseTypeLessThan(currentReleaseType, incomingReleaseType);

        if (isCurrentGreaterThan) {
          // node has changes and hasn't been visited yet
          // it will be processed later when it's its turn
          return;
        }

        let isDevDep = dag.dependencyType === 'devDependencies';

        if (shouldInheritGreaterReleaseType && !isDevDep) {
          current.releaseType = incomingReleaseType;
        } else {
          return;
        }
      } else if (currentReleaseType === defaultReleaseType) {
        // no upgrades needed
        return;
      }

      for (let group of dag.node.dependents) {
        if (group.isCycle) {
          continue;
        }

        crawlDag({
          dag: group,
          parent: current,
        });
      }
    })({
      dag,
    });
  }
}

function fourthPass({
  releaseTrees,
  packagesWithChanges,
  shouldBumpInRangeDependencies,
}) {
  for (let { dag, changedReleasableFiles } of packagesWithChanges) {
    if (!changedReleasableFiles.length) {
      continue;
    }

    (function crawlDag({
      dag,
      parent,
    }) {
      let current = releaseTrees[dag.node.packageName];

      if (!current) {
        return;
      }

      for (let type of dependencyTypes) {
        if (!current[type]) {
          current[type] = {};
        }
      }

      if (parent) {
        let { name } = parent;

        if (current[dag.dependencyType][name]) {
          return;
        }

        let oldRange = dag.dependencyRange;
        let newRange = oldRange.replace(/ +\|\| +[\d.]*-detached.*/, '');

        let newVersion = semver.inc(parent.oldVersion, parent.releaseType);

        if (shouldBumpInRangeDependencies || !semver.satisfies(newVersion, newRange)) {
          newRange = trackNewVersion({
            name,
            oldRange,
            newRange,
            newVersion,
          });
        }

        current[dag.dependencyType][name] = newRange;
      }

      for (let group of dag.node.dependents) {
        if (group.isCycle) {
          continue;
        }

        crawlDag({
          dag: group,
          parent: current,
        });
      }
    })({
      dag,
    });
  }
}

async function buildReleaseGraph({
  debug: _debug = debug,
  packagesWithChanges,
  shouldBumpInRangeDependencies,
  shouldInheritGreaterReleaseType,
  shouldExcludeDevChanges,
}) {
  let logSync = createSyncLogger(_debug);
  let logAsync = createAsyncLogger(_debug);

  let releaseTrees = {};

  await logAsync(firstPass, {
    releaseTrees,
    packagesWithChanges,
  });

  // only packages with changes have been analyzed

  await logAsync(secondPass, {
    releaseTrees,
    packagesWithChanges,
    shouldBumpInRangeDependencies,
    shouldInheritGreaterReleaseType,
    shouldExcludeDevChanges,
  });

  // packages without changes, but need to be analyzed because of options

  logSync(thirdPass, {
    releaseTrees,
    packagesWithChanges,
    shouldInheritGreaterReleaseType,
  });

  // dependents have now inherited release type

  logSync(fourthPass, {
    releaseTrees,
    packagesWithChanges,
    shouldBumpInRangeDependencies,
  });

  // dependencies are now bumped if needed

  return Object.values(releaseTrees);
}

module.exports = buildReleaseGraph;
Object.assign(module.exports, {
  getReleaseType,
});
