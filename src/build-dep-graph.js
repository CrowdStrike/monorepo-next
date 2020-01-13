'use strict';

const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const semver = require('semver');
const dependencyTypes = require('./dependency-types');
const exec = promisify(require('child_process').exec);

function copyDeps(left, right) {
  for (let dependencyType of dependencyTypes) {
    left[dependencyType] = { ...right[dependencyType] };
  }
}

function firstPass(workspaceMeta, workspacePackageJson, packageDirs) {
  workspaceMeta.packageName = workspacePackageJson.name || 'Workspace Root';
  workspaceMeta.version = workspacePackageJson.version;
  workspaceMeta.isPrivate = true;
  workspaceMeta.packages = {};
  copyDeps(workspaceMeta, workspacePackageJson);
  for (let packageDir of packageDirs) {
    let packageJson = require(path.join(packageDir, 'package'));
    let packageName = packageJson.name;
    workspaceMeta.packages[packageName] = {
      cwd: packageDir,
      packageName,
      version: packageJson.version,
      isPrivate: packageJson.private,
    };
    copyDeps(workspaceMeta.packages[packageName], packageJson);
  }
}

function deleteUnrecognizedDeps(_package, packageNames) {
  for (let dependencyType of dependencyTypes) {
    for (let dependencyName in _package[dependencyType]) {
      if (packageNames.includes(dependencyName)) {
        continue;
      }

      delete _package[dependencyType][dependencyName];
    }
  }
}

function deleteOutOfRangePackages(_package, packages) {
  for (let dependencyType of dependencyTypes) {
    for (let packageName in _package[dependencyType]) {
      let versionRange = _package[dependencyType][packageName];
      if (semver.satisfies(packages[packageName].version, versionRange)) {
        continue;
      }

      delete _package[dependencyType][packageName];
    }
  }
}

function secondPass(workspaceMeta) {
  let { packages } = workspaceMeta;
  let packageNames = Object.keys(packages);
  deleteUnrecognizedDeps(workspaceMeta, packageNames);
  deleteOutOfRangePackages(workspaceMeta, packages);
  for (let _package of Object.values(packages)) {
    deleteUnrecognizedDeps(_package, packageNames);
    deleteOutOfRangePackages(_package, packages);
  }
}

async function buildDepGraph(workspaceCwd) {
  let workspacePackageJson = require(path.join(workspaceCwd, 'package'));

  let { workspaces } = workspacePackageJson;

  let _1dFilesArray;
  if (!workspaces) {
    _1dFilesArray = (await exec('pnpm recursive exec -- node -e "console.log(process.cwd())"', { cwd: workspaceCwd })).stdout
      .split(/\r?\n/)
      .map(workspace => path.relative(workspaceCwd, workspace))
      .filter(Boolean);
  } else {
    let packages = workspaces.packages || workspaces;

    let _2dFilesArray = await Promise.all(packages.map(packagesGlob => {
      return glob(packagesGlob, {
        cwd: workspaceCwd,
      });
    }));

    _1dFilesArray = Array.prototype.concat.apply([], _2dFilesArray);
  }

  let uniqueFiles = [...new Set(_1dFilesArray)];

  let packageDirs = uniqueFiles.map(file => path.join(workspaceCwd, file));

  let workspaceMeta = {
    cwd: workspaceCwd,
  };

  firstPass(workspaceMeta, workspacePackageJson, packageDirs);
  secondPass(workspaceMeta);

  return workspaceMeta;
}

module.exports = buildDepGraph;
