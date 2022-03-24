'use strict';

const path = require('path');
const {
  read: readJson,
} = require('./json');
const { trackNewVersion } = require('./version');
const semver = require('semver');
const dependencyTypes = require('./dependency-types');
const { isCycle } = require('./build-dag');

const defaultReleaseType = 'patch';

async function getReleaseType(packageName, cwd, useFork) {
  let tagPrefix = `${packageName}@`;
  let releaseType;

  if (useFork) {
    let process = require('child_process').fork(require.resolve('./get-release-type'), [tagPrefix], {
      cwd,
    });

    releaseType = await new Promise((resolve, reject) => {
      process.on('message', resolve);
      process.on('error', reject);
    });
  } else {
    releaseType = await require('./get-release-type')(tagPrefix, cwd);
  }

  return releaseType;
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
  useFork,
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
    releaseType = await module.exports.getReleaseType(name, cwd, useFork);
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
  let promises = [];
  let unorderedReleaseTrees = {};

  for (let { dag, changedReleasableFiles } of packagesWithChanges) {
    if (!changedReleasableFiles.length) {
      continue;
    }

    let promise = init({
      dag,
      releaseTrees: unorderedReleaseTrees,
      useFork: true,
    });

    promises.push(promise);
  }

  await Promise.all(promises);

  for (let { dag: { packageName } } of packagesWithChanges) {
    let releaseTree = unorderedReleaseTrees[packageName];

    if (releaseTree) {
      releaseTrees[packageName] = releaseTree;
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

      if (parent) {
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
