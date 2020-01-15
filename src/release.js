'use strict';

const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const {
  read: readJson,
  write: writeJson,
} = require('./json');
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const buildReleaseGraph = require('./build-release-graph');
const dependencyTypes = require('./dependency-types');

const { builder } = require('../bin/commands/release');

async function getCurrentBranch(cwd) {
  return (await exec('git rev-parse --abbrev-ref HEAD', { cwd })).stdout.trim();
}

async function release({
  cwd,
  silent,
  shouldPush = builder['push'].default,
  shouldPublish = builder['publish'].default,
  shouldBumpInRangeDependencies = builder['bump-in-range-dependencies'].default,
  shouldInheritGreaterReleaseType = builder['inherit-greater-release-type'].default,
  scripts = builder['scripts'].default,
  packageFiles = builder['package-files'].default,
  bumpFiles = builder['bump-files'].default,
  versionOverride,
  preCommitCallback = () => {},
  prePushCallback = () => {},
  pushOverride,
  prePublishCallback = () => {},
  publishOverride,
}) {
  let currentBranch = await getCurrentBranch(cwd);
  if (currentBranch !== 'master') {
    return;
  }

  let workspaceCwd = (await exec('git rev-parse --show-toplevel', { cwd })).stdout.trim();

  let workspaceMeta = await buildDepGraph(workspaceCwd);

  let packagesWithChanges = await buildChangeGraph(workspaceMeta);

  packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
    return dag.packageName && dag.version;
  });

  if (!packagesWithChanges.length) {
    console.log('no releasable code');
    return;
  }

  let releaseTrees = await buildReleaseGraph({
    packagesWithChanges,
    shouldBumpInRangeDependencies,
    shouldInheritGreaterReleaseType,
  });

  for (let releaseTree of releaseTrees) {
    let name = releaseTree.name;
    let cwd = releaseTree.cwd;

    let packageJsonPath = path.join(cwd, 'package.json');
    let packageJson = await readJson(packageJsonPath);

    if (releaseTree.oldVersion) {
      packageJson.version = releaseTree.oldVersion;
    }

    for (let type of dependencyTypes) {
      let deps = releaseTree[type];

      for (let { name, newRange } of deps) {
        packageJson[type][name] = newRange;
      }
    }

    await writeJson(packageJsonPath, packageJson);

    // eslint-disable-next-line no-inner-declarations
    async function originalVersion(options) {
      await require('standard-version')({
        path: cwd,
        skip: {
          commit: true,
          tag: true,
        },
        silent,
        tagPrefix: `${name}@`,
        releaseAs: releaseTree.releaseType,
        scripts,
        packageFiles,
        bumpFiles,
        ...options,
      });
    }

    if (releaseTree.canBumpVersion) {
      let originalCwd = process.cwd();

      try {
        process.chdir(cwd);

        if (versionOverride) {
          await versionOverride({
            cwd,
            originalVersion,
          });
        } else {
          await originalVersion();
        }
      } finally {
        process.chdir(originalCwd);
      }

      let { version } = await readJson(packageJsonPath);

      // eslint-disable-next-line require-atomic-updates
      releaseTree.newVersion = version;
    }
  }

  let tags = releaseTrees
    .filter(({ canBumpVersion }) => canBumpVersion)
    .map(({ name, newVersion }) => `${name}@${newVersion}`);

  let commitMessage = `Version ${tags.join()}`;

  await exec('git add .', { cwd: workspaceCwd });

  await preCommitCallback();

  await exec(`git commit -m "${commitMessage}"`, { cwd: workspaceCwd });

  for (let tag of tags) {
    await exec(`git tag -a ${tag} -m "${tag}"`, { cwd: workspaceCwd });
  }

  async function originalPush() {
    await push({ cwd: workspaceCwd });
  }

  if (shouldPush) {
    await prePushCallback();

    if (pushOverride) {
      await pushOverride({
        cwd: workspaceCwd,
        originalPush,
      });
    } else {
      await originalPush();
    }
  }

  if (shouldPublish) {
    await prePublishCallback();
  }

  // eslint-disable-next-line require-atomic-updates
  for (let { canPublish, cwd } of releaseTrees) {
    if (shouldPublish && canPublish) {
      // eslint-disable-next-line no-inner-declarations
      async function originalPublish() {
        await publish({ cwd });
      }

      if (publishOverride) {
        await publishOverride({
          cwd,
          originalPublish,
        });
      } else {
        await originalPublish();
      }
    }
  }
}

async function push({ cwd }) {
  let remoteUrl = (await exec('git config --get remote.origin.url', { cwd })).stdout.trim();

  // https://stackoverflow.com/a/55586434
  let doesntSupportAtomic = remoteUrl.includes('https://');

  let success;

  try {
    if (doesntSupportAtomic) {
      await exec('git push', { cwd });
    } else {
      await exec('git push --follow-tags --atomic', { cwd });
    }

    success = true;
  } catch (err) {
    if (!err.message.includes('EPUBLISHCONFLICT')) {
      throw err;
    }

    // CI could have already released, or a user released locally
    console.warn('version already published');
  }

  if (doesntSupportAtomic && success) {
    // only push tags after the commit
    // and hard error if there is a tag collision
    await exec('git push --follow-tags', { cwd });
  }
}

async function publish({ cwd }) {
  await exec('npm publish', { cwd });
}

module.exports = release;
