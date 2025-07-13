'use strict';

const path = require('path');
const { execa } = require('./process');
const {
  read: readJson,
  write: writeJson,
} = require('./json');
const buildDepGraph = require('./build-dep-graph');
const buildChangeGraph = require('./build-change-graph');
const buildReleaseGraph = require('./build-release-graph');
const dependencyTypes = require('./dependency-types');
const {
  getCurrentBranch,
  getWorkspaceCwd,
  getCurrentCommit,
} = require('./git');
const semver = require('semver');
const { builder } = require('../bin/commands/release');
const debug = require('./debug');
const { createAsyncLogger } = require('./log');
const {
  exists: fsExists,
} = require('./fs');

async function release({
  cwd = process.cwd(),
  silent,
  dryRun = builder['dry-run'].default,
  shouldPush = builder['push'].default,
  shouldPublish = builder['publish'].default,
  distTag = builder['dist-tag'].default,
  shouldBumpInRangeDependencies = builder['bump-in-range-dependencies'].default,
  shouldInheritGreaterReleaseType = builder['inherit-greater-release-type'].default,
  shouldExcludeDevChanges = builder['exclude-dev-changes'].default,
  shouldValidateDependencyVisibility = builder['validate-dependency-visibility'].default,
  shouldCleanUpAfterFailedPush = builder['clean-up-after-failed-push'].default,
  scripts = builder['scripts'].default,
  packageFiles = builder['package-files'].default,
  bumpFiles = builder['bump-files'].default,
  defaultBranch = builder['default-branch'].default,
  versionOverride,
  preCommitCallback = () => {},
  prePushCallback = () => {},
  pushOverride,
  prePublishCallback = () => {},
  publishOverride,
  cached,
} = {}) {
  let _debug = debug.extend(release.name);
  let logAsync = createAsyncLogger(_debug);

  let currentBranch = await getCurrentBranch(cwd);
  if (currentBranch !== defaultBranch) {
    console.log(`branch mismatch. defaultBranch: ${defaultBranch}, currentBranch: ${currentBranch}`);
    return;
  }

  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await logAsync(buildDepGraph, { workspaceCwd });

  let packagesWithChanges = await logAsync(buildChangeGraph, {
    workspaceMeta,
    shouldExcludeDevChanges,
    cached,
  });

  packagesWithChanges = packagesWithChanges.filter(({ dag }) => {
    return dag.node.packageName && dag.node.version;
  });

  if (!packagesWithChanges.some(({ changedReleasableFiles }) => changedReleasableFiles.length)) {
    console.log('no releasable code');
    return;
  }

  let releaseTrees = await logAsync(buildReleaseGraph, {
    debug: _debug,
    packagesWithChanges,
    shouldBumpInRangeDependencies,
    shouldInheritGreaterReleaseType,
    shouldExcludeDevChanges,
    shouldValidateDependencyVisibility,
  });

  for (let releaseTree of releaseTrees) {
    let name = releaseTree.name;
    let cwd = releaseTree.cwd;

    let packageJsonPath = path.join(cwd, 'package.json');
    let packageJson = await readJson(packageJsonPath);

    if (releaseTree.oldVersion && releaseTree.oldVersion !== packageJson.version) {
      _log(`Updating ${packageJson.name} from ${packageJson.version} to ${releaseTree.oldVersion}.`);

      packageJson.version = releaseTree.oldVersion;
    }

    for (let type of dependencyTypes) {
      let deps = releaseTree[type];

      for (let [name, newRange] of Object.entries(deps)) {
        let oldRange = packageJson[type][name];

        if (newRange !== oldRange) {
          _log(`Updating ${packageJson.name} ${type} ${name} from ${oldRange} to ${newRange}.`);

          packageJson[type][name] = newRange;
        }
      }
    }

    if (!dryRun) {
      await writeJson(packageJsonPath, packageJson);
    }

    // eslint-disable-next-line no-inner-declarations
    async function originalVersion(options) {
      await require('commit-and-tag-version')({
        path: cwd,
        skip: {
          commit: true,
          tag: true,
        },
        silent,
        dryRun,
        tagPrefix: `${name}@`,
        releaseAs: releaseTree.releaseType,
        scripts,
        packageFiles,
        bumpFiles,
        ...options,
      });
    }

    if (releaseTree.shouldBumpVersion) {
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

      let version;

      if (dryRun) {
        version = semver.inc(releaseTree.oldVersion, releaseTree.releaseType);
      } else {
        version = (await readJson(packageJsonPath)).version;
      }

      // eslint-disable-next-line require-atomic-updates
      releaseTree.newVersion = version;
    }
  }

  async function handleLifecycleScript(lifecycle) {
    let script = scripts[lifecycle];
    if (script) {
      await execa.command(script, {
        shell: true,
        silent,
        dryRun,
        cwd,
      });
    }
  }

  let tags = releaseTrees
    .filter(({ shouldBumpVersion }) => shouldBumpVersion)
    .map(({ name, newVersion }) => `${name}@${newVersion}`);

  let commitMessage = `chore(release): ${tags.join()}`;

  if (await fsExists(path.join(workspaceCwd, 'pnpm-lock.yaml'))) {
    await module.exports.updatePnpmLockfile({ cwd: workspaceCwd, silent, dryRun });
  } else if (await fsExists(path.join(workspaceCwd, 'yarn.lock'))) {
    await module.exports.updateYarnLockfile({ cwd: workspaceCwd, silent, dryRun });
  }

  if (!dryRun) {
    await execa('git', ['add', '-A'], { cwd: workspaceCwd, silent: true });
  }

  await preCommitCallback({ dryRun });

  await handleLifecycleScript('precommit');

  let previousCommit = await getCurrentCommit(workspaceCwd);

  await execa('git', ['commit', '-m', commitMessage], { cwd: workspaceCwd, silent, dryRun });

  await handleLifecycleScript('postcommit');

  await handleLifecycleScript('pretag');

  for (let tag of tags) {
    await execa('git', ['tag', '-a', tag, '-m', tag], { cwd: workspaceCwd, silent, dryRun });
  }

  await handleLifecycleScript('posttag');

  async function originalPush() {
    await push({ cwd: workspaceCwd, silent, dryRun });
  }

  if (shouldPush) {
    await prePushCallback({ dryRun });

    try {
      if (pushOverride) {
        await pushOverride({
          cwd: workspaceCwd,
          originalPush,
          dryRun,
        });
      } else {
        await originalPush();
      }
    } catch (err) {
      if (!dryRun) {
        if (shouldCleanUpAfterFailedPush) {
          await execa('git', ['tag', '-d', ...tags], { cwd: workspaceCwd, silent });
        }

        await execa('git', ['reset', '--hard', previousCommit], { cwd: workspaceCwd, silent });
      }

      throw err;
    }
  }

  if (shouldPublish) {
    await prePublishCallback({ distTag, dryRun });
  }

  // eslint-disable-next-line require-atomic-updates
  for (let { shouldPublish: _shouldPublish, cwd } of releaseTrees) {
    if (shouldPublish && _shouldPublish) {
      // eslint-disable-next-line no-inner-declarations
      async function originalPublish() {
        await publish({ cwd, silent, distTag, dryRun });
      }

      if (publishOverride) {
        await publishOverride({
          cwd,
          originalPublish,
          distTag,
          dryRun,
        });
      } else {
        await originalPublish();
      }
    }
  }

  function _log() {
    if (silent) {
      return;
    }

    console.log(...arguments);
  }
}

async function push({ cwd, silent, dryRun }) {
  let remoteUrl = (await execa('git', ['config', '--get', 'remote.origin.url'], { cwd, silent: true })).stdout;

  let dryRunArgs = dryRun ? ['--dry-run'] : [];

  // https://stackoverflow.com/a/55586434
  let doesntSupportAtomic = remoteUrl.includes('https://');

  let success;

  try {
    if (doesntSupportAtomic) {
      await execa('git', ['push', ...dryRunArgs], { cwd, silent });
    } else {
      await execa('git', ['push', '--follow-tags', '--atomic', ...dryRunArgs], { cwd, silent });
    }

    success = true;
  } catch (err) {
    if (!err.message.includes('non-fast-forward')) {
      throw err;
    }

    // CI could have already released, or a user released locally
    console.warn('version already published');
  }

  if (doesntSupportAtomic && success) {
    // only push tags after the commit
    // and hard error if there is a tag collision
    await execa('git', ['push', '--follow-tags', ...dryRunArgs], { cwd, silent });
  }
}

async function publish({ cwd, silent, distTag, dryRun }) {
  let dryRunArgs = dryRun ? ['--dry-run'] : [];

  await execa('npm', ['publish', '--tag', distTag, ...dryRunArgs], { cwd, silent });
}

async function updatePnpmLockfile({ cwd, silent, dryRun }) {
  await execa('pnpm', ['install', '--lockfile-only'], { cwd, silent, dryRun });
}

/**
 * You could have a case of using external packages which in turn,
 * reach back into the current monorepo and use its packages.
 * This could cause package version matches where it uses the local version,
 * but then during version bumping, the version is now not matching,
 * and it has to go to NPM to get the old version,
 * and it needs to update the lockfile.
 */
async function updateYarnLockfile({ cwd, silent, dryRun }) {
  await execa('yarn', ['install'], { cwd, silent, dryRun });
}

module.exports = release;
module.exports = Object.assign(release, {
  updatePnpmLockfile,
  updateYarnLockfile,
});
