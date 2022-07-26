'use strict';

const path = require('path');
const semver = require('semver');
const dependencyTypes = require('./dependency-types');
const readJson = require('./json').read;
const getWorkspacesPaths = require('./get-workspaces-paths');

function copyDeps(left, right) {
  for (let dependencyType of dependencyTypes) {
    left[dependencyType] = { ...right[dependencyType] };
  }
}

async function firstPass(workspaceMeta, workspacePackageJson, packageDirs) {
  workspaceMeta.packageName = workspacePackageJson.name || 'Workspace Root';
  workspaceMeta.version = workspacePackageJson.version;
  workspaceMeta.isPrivate = true;
  workspaceMeta.packages = {};
  copyDeps(workspaceMeta, workspacePackageJson);
  for (let packageDir of packageDirs) {
    let packageJson;
    try {
      packageJson = await readJson(path.join(packageDir, 'package.json'));
    } catch (err) {
      // ignore empty folders
      continue;
    }
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
  for (let _package of [...Object.values(packages), workspaceMeta]) {
    deleteUnrecognizedDeps(_package, packageNames);
    deleteOutOfRangePackages(_package, packages);
  }
}

async function buildDepGraph({
  workspaceCwd,
  shouldPruneDeps = true,
}) {
  let workspacePackageJson = await readJson(path.join(workspaceCwd, 'package.json'));

  let workspaces = await getWorkspacesPaths({ workspaceCwd });

  let packageDirs = workspaces.map(dir => path.join(workspaceCwd, dir));

  let workspaceMeta = {
    cwd: workspaceCwd,
  };

  await firstPass(workspaceMeta, workspacePackageJson, packageDirs);
  if (shouldPruneDeps) {
    secondPass(workspaceMeta);
  }

  return workspaceMeta;
}

function collectPackages(workspaceMeta) {
  return [...Object.values(workspaceMeta.packages), workspaceMeta];
}

module.exports = buildDepGraph;
Object.assign(module.exports, {
  collectPackages,
});
