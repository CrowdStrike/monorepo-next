'use strict';

const execa = require('execa');
const path = require('path');
const readJson = require('./json').read;

async function getWorkspacesPaths({
  workspaceCwd,
}) {
  let workspacePackageJson = await readJson(path.join(workspaceCwd, 'package.json'));

  let { workspaces } = workspacePackageJson;

  if (!workspaces) {
    workspaces = (await execa('pnpm', ['recursive', 'exec', '--', 'node', '-e', 'console.log(process.cwd())'], { cwd: workspaceCwd })).stdout
      .split(/\r?\n/)
      .map(workspace => path.relative(workspaceCwd, workspace));
  } else {
    let jsonString = (
      await execa('yarn', ['--silent', 'workspaces', 'info'], {
        cwd: workspaceCwd,
      })
    ).stdout;
  
    let workspacesJson = JSON.parse(jsonString);
    
    workspaces = Object.values(workspacesJson).map(({ location }) => location);
  }

  return workspaces;
}

module.exports = getWorkspacesPaths;
