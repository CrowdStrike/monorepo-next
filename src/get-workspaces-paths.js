'use strict';

const execa = require('execa');
const path = require('path');
const readJson = require('./json').read;
const readJsonSync = require('./json').readSync;

async function getWorkspacesPaths({
  cwd,
}) {
  let workspacePackageJson = await readJson(path.join(cwd, 'package.json'));

  let { workspaces } = workspacePackageJson;

  if (!workspaces) {
    workspaces = (await execa('pnpm', ['recursive', 'exec', '--', 'node', '-e', 'console.log(process.cwd())'], { cwd })).stdout
      .split(/\r?\n/)
      .map(workspace => path.relative(cwd, workspace));
  } else {
    let jsonString = (
      await execa('yarn', ['--silent', 'workspaces', 'info'], {
        cwd,
      })
    ).stdout;

    let workspacesJson = JSON.parse(jsonString);

    workspaces = Object.values(workspacesJson).map(({ location }) => location);
  }

  return workspaces;
}

function getWorkspacesPathsSync({
  cwd,
}) {
  let workspacePackageJson = readJsonSync(path.join(cwd, 'package.json'));

  let { workspaces } = workspacePackageJson;

  if (!workspaces) {
    workspaces = (execa.sync('pnpm', ['recursive', 'exec', '--', 'node', '-e', 'console.log(process.cwd())'], { cwd })).stdout
      .split(/\r?\n/)
      .map(workspace => path.relative(cwd, workspace));
  } else {
    let jsonString = (
      execa.sync('yarn', ['--silent', 'workspaces', 'info'], {
        cwd,
      })
    ).stdout;

    let workspacesJson = JSON.parse(jsonString);

    workspaces = Object.values(workspacesJson).map(({ location }) => location);
  }
  return workspaces;
}

module.exports = {
  getWorkspacesPaths,
  getWorkspacesPathsSync,
};
