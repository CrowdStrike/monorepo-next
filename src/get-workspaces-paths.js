'use strict';

const execa = require('execa');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const path = require('path');
const readJson = require('./json').read;

async function getWorkspacesPaths({
  workspaceCwd,
}) {
  let workspacePackageJson = await readJson(path.join(workspaceCwd, 'package.json'));

  let { workspaces } = workspacePackageJson;

  let _1dFilesArray;

  if (!workspaces) {
    _1dFilesArray = (await execa('pnpm', ['recursive', 'exec', '--', 'node', '-e', 'console.log(process.cwd())'], { cwd: workspaceCwd })).stdout
      .split(/\r?\n/)
      .map(workspace => path.relative(workspaceCwd, workspace));

  } else {
    let packagesGlobs = workspaces.packages || workspaces;
    
    let _2dFilesArray = await Promise.all(packagesGlobs.map(packagesGlob => {
      return glob(packagesGlob, {
        cwd: workspaceCwd,
      });
    }));
    
    _1dFilesArray = Array.prototype.concat.apply([], _2dFilesArray);
  }
    
  workspaces = [...new Set(_1dFilesArray)];
    
  return workspaces;
}

module.exports = getWorkspacesPaths;
