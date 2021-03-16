'use strict';

const {
  getWorkspaceCwd,
} = require('./git');
const buildDepGraph = require('./build-dep-graph');
const { collectPackages } = buildDepGraph;
const dependencyTypes = require('./dependency-types');
const semverMinVersion = require('semver/ranges/min-version');
const semverGt = require('semver/functions/gt');
const semverSatisfies = require('semver/functions/satisfies');
const semverValidRange = require('semver/ranges/valid');
const semverMajor = require('semver/functions/major');
const semverMinor = require('semver/functions/minor');
const Range = require('semver/classes/range');
const path = require('path');
const { replaceJsonFile } = require('./fs');

const defaultInclude = [];
const defaultExclude = [];

function collectAllRanges(workspaceMeta, {
  include = defaultInclude,
  exclude = defaultExclude,
} = {}) {
  let allRanges = {};

  for (let _package of collectPackages(workspaceMeta)) {
    for (let dependencyType of dependencyTypes) {
      let dependencies = _package[dependencyType];

      for (let [packageName, versionRange] of Object.entries(dependencies)) {
        if (include.length && !include.includes(packageName)) {
          continue;
        }

        if (exclude.length && exclude.includes(packageName)) {
          continue;
        }

        if (!allRanges[packageName]) {
          allRanges[packageName] = [];
        }

        allRanges[packageName].push(versionRange);
      }
    }
  }

  return allRanges;
}

function filterRangeUpdates(allRanges, {
  outOfRange,
} = {}) {
  let rangeUpdates = {};

  for (let [packageName, ranges] of Object.entries(allRanges)) {
    for (let oldRange of ranges) {
      for (let newRange of ranges) {
        if (oldRange === newRange) {
          continue;
        }

        if (!semverValidRange(oldRange) || !semverValidRange(newRange)) {
          continue;
        }

        // Assume ranges like "*" are monorepo links
        // and should be ignored.
        if (new Range(oldRange).range === '') {
          continue;
        }

        let oldMinVersion = semverMinVersion(oldRange);
        let newMinVersion = semverMinVersion(newRange);

        let oldMajor = semverMajor(oldMinVersion).toString();
        let oldMinor = semverMinor(oldMinVersion).toString();

        let isInRange = false;

        switch (outOfRange) {
          default:
            isInRange = semverSatisfies(newMinVersion, oldRange);
            break;
          case 'patch':
            isInRange = semverSatisfies(newMinVersion, `${oldMajor}.${oldMinor}`);
            break;
          case 'minor':
            isInRange = semverSatisfies(newMinVersion, oldMajor);
            break;
          case 'major':
            isInRange = true;
            break;
        }

        if (isInRange) {
          if (semverGt(newMinVersion, oldMinVersion)) {
            if (!rangeUpdates[packageName]) {
              rangeUpdates[packageName] = {};
            }

            rangeUpdates[packageName][oldRange] = newRange;
          }
        }
      }
    }
  }

  return rangeUpdates;
}

function applyRangeUpdates(workspaceMeta, rangeUpdates, {
  dryRun,
} = {}) {
  for (let _package of collectPackages(workspaceMeta)) {
    for (let dependencyType of dependencyTypes) {
      let dependencies = _package[dependencyType];

      for (let [packageName, rangeUpdatesForPackage] of Object.entries(rangeUpdates)) {
        if (!(packageName in dependencies)) {
          continue;
        }

        let oldRange = dependencies[packageName];

        if (!(oldRange in rangeUpdatesForPackage)) {
          continue;
        }

        let newRange = rangeUpdatesForPackage[oldRange];

        if (dryRun) {
          console.log(`${_package.packageName}.${dependencyType}.${packageName}: ${oldRange} -> ${newRange}`);
        } else {
          dependencies[packageName] = newRange;
        }
      }
    }
  }
}

async function fourthPass(workspaceMeta) {
  for (let _package of collectPackages(workspaceMeta)) {
    await replaceJsonFile(path.join(_package.cwd, 'package.json'), packageJson => {
      for (let dependencyType of dependencyTypes) {
        let dependencies = _package[dependencyType];

        if (Object.keys(dependencies).length) {
          packageJson[dependencyType] = dependencies;
        }
      }
    });
  }
}

async function defrag({
  cwd = process.cwd(),
  include,
  exclude,
  outOfRange,
  dryRun,
}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({
    workspaceCwd,
    shouldPruneDeps: false,
  });

  let allRanges = collectAllRanges(workspaceMeta, {
    include,
    exclude,
  });
  let rangeUpdates = filterRangeUpdates(allRanges, {
    outOfRange,
  });
  applyRangeUpdates(workspaceMeta, rangeUpdates, {
    dryRun,
  });

  if (dryRun) {
    return;
  }

  await fourthPass(workspaceMeta);
}

module.exports = defrag;
Object.assign(module.exports, {
  collectAllRanges,
  filterRangeUpdates,
  applyRangeUpdates,
});
