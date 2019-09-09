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
const { trackNewVersion } = require('./version');

const { builder } = require('../bin/commands/release');

async function getCurrentBranch(cwd) {
  return (await exec('git rev-parse --abbrev-ref HEAD', { cwd })).stdout.trim();
}

async function release({
  cwd,
  silent,
  shouldPush = builder.push.default,
  shouldPublish = builder.publish.default,
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

  let {
    releaseTypes,
    releaseTrees,
  } = await buildReleaseGraph(packagesWithChanges);

  if (!releaseTrees.length) {
    console.log('no releasable code');
    return;
  }

  for (let dag of releaseTrees) {
    let name = dag.packageName;

    let packageJsonPath = path.join(dag.cwd, 'package.json');
    let packageJson = await readJson(packageJsonPath);

    let matches = packageJson.version.match(/(.*)-detached.*/);

    if (matches) {
      packageJson.version = matches[1];

      await writeJson(packageJsonPath, packageJson);
    }

    // eslint-disable-next-line no-inner-declarations
    async function originalVersion(options) {
      await require('standard-version')({
        path: dag.cwd,
        skip: {
          commit: true,
          tag: true,
        },
        silent,
        tagPrefix: `${name}@`,
        releaseAs: releaseTypes[name],
        ...options,
      });
    }

    let originalCwd = process.cwd();

    try {
      process.chdir(dag.cwd);

      if (versionOverride) {
        await versionOverride({
          cwd: dag.cwd,
          originalVersion,
        });
      } else {
        await originalVersion();
      }
    } finally {
      process.chdir(originalCwd);
    }

    let { version } = await readJson(packageJsonPath);

    for (let dependent of dag.dependents) {
      let packageJsonPath = path.join(dependent.cwd, 'package.json');
      let packageJson = await readJson(packageJsonPath);

      for (let type of [
        'dependencies',
        'devDependencies',
      ]) {
        let deps = packageJson[type];

        for (let _name in deps) {
          if (_name !== name) {
            continue;
          }

          deps[name] = trackNewVersion(name, deps[name], version);

          break;
        }
      }

      await writeJson(packageJsonPath, packageJson);
    }

    // eslint-disable-next-line require-atomic-updates
    dag.version = version;
  }

  let commitMessage = `Version ${releaseTrees.map(dag => `${dag.packageName}@${dag.version}`).join()}`;

  await exec('git add .', { cwd: workspaceCwd });

  await preCommitCallback();

  await exec(`git commit -m "${commitMessage}"`, { cwd: workspaceCwd });

  for (let dag of releaseTrees) {
    await exec(`git tag ${dag.packageName}@${dag.version}`, { cwd: workspaceCwd });
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
  for (let dag of releaseTrees) {
    if (shouldPublish && dag.isPackage) {
      // eslint-disable-next-line no-inner-declarations
      async function originalPublish() {
        await publish({ cwd: dag.cwd });
      }

      if (publishOverride) {
        await publishOverride({
          cwd: dag.cwd,
          originalPublish,
        });
      } else {
        await originalPublish();
      }
    }
  }
}

async function push({ cwd }) {
  try {
    await exec('git push --follow-tags --atomic', { cwd });
  } catch (err) {
    if (!err.message.includes('EPUBLISHCONFLICT')) {
      throw err;
    }

    // CI could have already released, or a user released locally
    console.warn('version already published');
  }
}

async function publish({ cwd }) {
  await exec('npm publish', { cwd });
}

module.exports = release;
