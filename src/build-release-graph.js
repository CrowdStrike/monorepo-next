'use strict';

const { promisify } = require('util');
const conventionalRecommendedBump = promisify(require('conventional-recommended-bump'));
const path = require('path');
const {
  read: readJson,
} = require('./json');
const { trackNewVersion } = require('./version');
const semver = require('semver');
const dependencyTypes = require('./dependency-types');
const { loadPackageConfig } = require('./config');

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

  let canBumpVersion = !!(version && name);
  let canPublish = isPackage;

  let shouldVersionBump = false;

  let releaseTree = {
    oldVersion: version,
    releaseType: defaultReleaseType,
    cwd,
    name,
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

    releaseTree.releaseType = await module.exports.getReleaseType(name, cwd);
  }
}

async function secondPass({
  releaseTrees,
  packagesWithChanges,
  shouldBumpInRangeDependencies,
  shouldInheritGreaterReleaseType,
  shouldExcludeDevChanges,
}) {
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

      visitedNodes.add(dag.node.packageName);

      let nextConfig = loadPackageConfig(dag.node.cwd);

      if (!nextConfig.shouldBumpVersion) {
        return;
      }

      let doesPackageHaveChanges = !!releaseTrees[dag.node.packageName];
      if (!doesPackageHaveChanges) {
        let isDevDep = dag.dependencyType === 'devDependencies';

        if (dag.node.isPackage && shouldInheritGreaterReleaseType && !isDevDep && shouldBumpInRangeDependencies) {
          await init({ dag, releaseTrees });
        } else if (!isReleaseTypeInRange(parent.oldVersion, parent.releaseType, dag.dependencyRange)) {
          await init({ dag, releaseTrees });
        } else if (shouldBumpInRangeDependencies) {
          await init({ dag, releaseTrees });
        } else {
          return;
        }

        let shouldVersionBump = !(shouldExcludeDevChanges && isDevDep);

        if (!shouldVersionBump) {
          return;
        }
      }

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
  shouldExcludeDevChanges,
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

      let isDevDep = dag.dependencyType === 'devDependencies';
      let currentReleaseType = current.releaseType;
      let incomingReleaseType = parent ? parent.releaseType : currentReleaseType;

      if (shouldInheritGreaterReleaseType && !isDevDep && isReleaseTypeLessThan(currentReleaseType, incomingReleaseType)) {
        currentReleaseType = incomingReleaseType;
      }

      current.releaseType = currentReleaseType;

      let shouldVersionBump = !(shouldExcludeDevChanges && isDevDep);

      if (shouldVersionBump) {
        current[shouldVersionBumpSymbol]();
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

      if (parent && !current[dag.dependencyType][parent.name]) {
        let { name } = parent;

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
  packagesWithChanges,
  shouldBumpInRangeDependencies,
  shouldInheritGreaterReleaseType,
  shouldExcludeDevChanges,
}) {
  let releaseTrees = {};

  await firstPass({
    releaseTrees,
    packagesWithChanges,
  });

  // only packages with changes have been analyzed

  await secondPass({
    releaseTrees,
    packagesWithChanges,
    shouldBumpInRangeDependencies,
    shouldInheritGreaterReleaseType,
    shouldExcludeDevChanges,
  });

  // packages without changes, but need to be analyzed because of options

  thirdPass({
    releaseTrees,
    packagesWithChanges,
    shouldInheritGreaterReleaseType,
    shouldExcludeDevChanges,
  });

  // dependents have now inherited release type

  fourthPass({
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
