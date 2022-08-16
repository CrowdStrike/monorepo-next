'use strict';

const execa = require('execa');
const fs = { ...require('fs'), ...require('fs').promises };
const { promisify } = require('util');
const glob = promisify(require('glob'));
const jsYaml = require('js-yaml');
const path = require('path');
const readJson = require('./json').read;
const readJsonSync = require('./json').readSync;

function processPnpm({ stdout }, cwd) {
  let workspaces = stdout.split(/\r?\n/).reduce((workspaces, workspace) => {
    if (!workspace.startsWith('No projects matched the filters')) {
      if (process.platform === 'darwin' && workspace.startsWith(`${path.sep}private${path.sep}`)) {
        workspace = `${path.sep}${path.relative(`${path.sep}private`, workspace)}`;
      }

      let relative = path.relative(cwd, workspace);

      workspaces.push(relative);
    }

    return workspaces;
  }, []);

  return workspaces;
}

function processYarn({ stdout }) {
  let json = JSON.parse(stdout);

  let workspaces = Object.values(json).map(({ location }) => location);

  return workspaces;
}

function processPnpmYaml(buffer) {
  // read packagesGlobs excluding packagesGLobs starting with !
  // https://pnpm.io/pnpm-workspace_yaml
  let packagesGlobs = jsYaml.load(buffer).packages.filter((packagesGlob) => !packagesGlob.startsWith('!'));

  return packagesGlobs;
}

function processGlobs({ cwd, _2dFilesArray, isPnpm }) {
  let _1dFilesArray = Array.prototype.concat.apply([], _2dFilesArray);

  let packagePaths = [...new Set(_1dFilesArray)];

  let neededYarnKeys = ['name', 'version'];

  let workspaces = packagePaths.filter(packagePath => {
    let packageJson;

    try {
      packageJson = readJsonSync(path.join(cwd, packagePath, 'package.json'));
    } catch (err) {
      if (['ENOENT', 'ENOTDIR'].includes(err.code)) {
        return;
      }

      throw err;
    }

    if (isPnpm) {
      return true;
    }

    // for yarn, not a valid package if name and version are missing in package.json
    if (neededYarnKeys.every(key => key in packageJson)) {
      return true;
    }
  });

  return workspaces;
}

async function getWorkspacesPaths({
  cwd,
  shouldSpawn = false,
}) {
  let workspacePackageJson = await readJson(path.join(cwd, 'package.json'));

  let { workspaces } = workspacePackageJson;

  let isPnpm = !workspaces;

  if (shouldSpawn) {
    if (isPnpm) {
      workspaces = processPnpm(
        await execa('pnpm', ['recursive', 'exec', '--', 'node', '-e', 'console.log(process.cwd())'], {
          cwd,
        }),
        cwd,
      );
    } else {
      workspaces = processYarn(
        await execa('yarn', ['--silent', 'workspaces', 'info'], {
          cwd,
        }),
      );
    }
  } else {
    let packagesGlobs;

    if (isPnpm) {
      packagesGlobs = processPnpmYaml(
        await fs.readFile(path.join(cwd, 'pnpm-workspace.yaml')),
      );
    } else {
      packagesGlobs = workspaces.packages || workspaces;
    }

    let _2dFilesArray = await Promise.all(packagesGlobs.map(packagesGlob => {
      return glob(packagesGlob, {
        cwd,
      });
    }));

    workspaces = processGlobs({ cwd, _2dFilesArray, isPnpm });
  }

  return workspaces;
}

function getWorkspacesPathsSync({
  cwd,
  shouldSpawn = false,
}) {
  let workspacePackageJson = readJsonSync(path.join(cwd, 'package.json'));

  let { workspaces } = workspacePackageJson;

  let isPnpm = !workspaces;

  if (shouldSpawn) {
    if (isPnpm) {
      workspaces = processPnpm(
        execa.sync('pnpm', ['recursive', 'exec', '--', 'node', '-e', 'console.log(process.cwd())'], {
          cwd,
        }),
        cwd,
      );
    } else {
      workspaces = processYarn(
        execa.sync('yarn', ['--silent', 'workspaces', 'info'], {
          cwd,
        }),
      );
    }
  } else {
    let packagesGlobs;

    if (isPnpm) {
      packagesGlobs = processPnpmYaml(
        fs.readFileSync(path.join(cwd, 'pnpm-workspace.yaml')),
      );
    } else {
      packagesGlobs = workspaces.packages || workspaces;
    }

    let _2dFilesArray = packagesGlobs.map(packagesGlob => {
      return glob.sync(packagesGlob, {
        cwd,
      });
    });

    workspaces = processGlobs({ cwd, _2dFilesArray, isPnpm });
  }

  return workspaces;
}

module.exports = {
  getWorkspacesPaths,
  getWorkspacesPathsSync,
};
