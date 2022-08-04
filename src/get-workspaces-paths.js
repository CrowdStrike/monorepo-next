'use strict';

const execa = require('execa');
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

async function getWorkspacesPaths({
  cwd,
}) {
  let workspacePackageJson = await readJson(path.join(cwd, 'package.json'));

  let { workspaces } = workspacePackageJson;

  if (!workspaces) {
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

  return workspaces;
}

function getWorkspacesPathsSync({
  cwd,
}) {
  let workspacePackageJson = readJsonSync(path.join(cwd, 'package.json'));

  let { workspaces } = workspacePackageJson;

  if (!workspaces) {
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

  return workspaces;
}

module.exports = {
  getWorkspacesPaths,
  getWorkspacesPathsSync,
};
