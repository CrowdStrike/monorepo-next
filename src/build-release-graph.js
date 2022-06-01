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
const { isCycle } = require('./build-dag');

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

async function init({
  dag,
  releaseTrees,
  releaseType,
  shouldVersionBump = true,
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

  if (!releaseType) {
    releaseType = await module.exports.getReleaseType(name, cwd);
  }

  let canBumpVersion = !!(version && name);
  let canPublish = isPackage;
  let shouldBumpVersion = canBumpVersion && shouldVersionBump;
  let shouldPublish = canPublish && shouldBumpVersion;

  return releaseTrees[name] = {
    oldVersion: version,
    releaseType,
    cwd,
    name,
    shouldBumpVersion,
    shouldPublish,
  };
}

async function firstPass({
  releaseTrees,
  packagesWithChanges,
}) {
  for (let { dag, changedReleasableFiles } of packagesWithChanges) {
    if (!changedReleasableFiles.length) {
      continue;
    }

    await init({ dag, releaseTrees });
  }
}

async function secondPass({
  releaseTrees,
  packagesWithChanges,
  shouldBumpInRangeDependencies,
  shouldInheritGreaterReleaseType,
  shouldExcludeDevChanges,
}) {
  for (let { dag, changedReleasableFiles } of packagesWithChanges) {
    if (!changedReleasableFiles.length) {
      continue;
    }

    await (async function crawlDag({
      dag,
      parent,
    }) {
      let doesPackageHaveChanges = !!releaseTrees[dag.node.packageName];
      if (!doesPackageHaveChanges) {
        let isDevDep = dag.dependencyType === 'devDependencies';
        let shouldVersionBump = !shouldExcludeDevChanges || !isDevDep;

        if (dag.node.isPackage && shouldInheritGreaterReleaseType && !isDevDep && shouldBumpInRangeDependencies) {
          await init({ dag, releaseTrees, releaseType: parent.releaseType });
        } else if (!isReleaseTypeInRange(parent.oldVersion, parent.releaseType, dag.dependencyRange)) {
          await init({ dag, releaseTrees, releaseType: defaultReleaseType, shouldVersionBump });
        } else if (shouldBumpInRangeDependencies) {
          await init({ dag, releaseTrees, releaseType: defaultReleaseType, shouldVersionBump });
        } else {
          return;
        }

        if (!shouldVersionBump) {
          return;
        }
      }

      for (let group of dag.node.dependents) {
        if (isCycle(group)) {
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

      if (!current) {
        return;
      }

      let currentReleaseType = current.releaseType;

      let incomingReleaseType = parent ? parent.releaseType : currentReleaseType;

      if (shouldInheritGreaterReleaseType && dag.dependencyType !== 'devDependencies' && isReleaseTypeLessThan(currentReleaseType, incomingReleaseType)) {
        currentReleaseType = incomingReleaseType;
      }

      current.releaseType = currentReleaseType;

      for (let group of dag.node.dependents) {
        if (!group.node.isPackage || isCycle(group)) {
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
          current[type] = [];
        }
      }

      if (parent && !current[dag.dependencyType].some(({ name }) => name === parent.name)) {
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

        current[dag.dependencyType].push({
          name,
          newRange,
        });
      }

      for (let group of dag.node.dependents) {
        if (isCycle(group)) {
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
