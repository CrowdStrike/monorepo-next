'use strict';

const path = require('path');
const semver = require('semver');
const dependencyTypes = require('./dependency-types');
const readJson = require('./json').read;
const { getWorkspacesPaths } = require('./get-workspaces-paths');

function copyDeps(left, right) {
  for (let dependencyType of dependencyTypes) {
    left[dependencyType] = { ...right[dependencyType] };
  }
}

function firstPass(workspaceMeta, workspacePackageJson, workspacesPackageJsons) {
  workspaceMeta.packageName = workspacePackageJson.name || 'Workspace Root';
  workspaceMeta.version = workspacePackageJson.version;
  workspaceMeta.isPrivate = true;
  workspaceMeta.packages = {};
  copyDeps(workspaceMeta, workspacePackageJson);
  for (let [workspace, packageJson] of Object.entries(workspacesPackageJsons)) {
    let packageName = packageJson.name;
    workspaceMeta.packages[packageName] = {
      cwd: path.join(workspaceMeta.cwd, workspace),
      packageName,
      version: packageJson.version,
      isPrivate: packageJson.private || false,
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
  for (let _package of collectPackages(workspaceMeta)) {
    deleteUnrecognizedDeps(_package, packageNames);
    deleteOutOfRangePackages(_package, packages);
  }
}

async function buildDepGraph({
  workspaceCwd,
  ...options
}) {
  let workspacePackageJson = await readJson(path.join(workspaceCwd, 'package.json'));

  let workspaces = await getWorkspacesPaths({ cwd: workspaceCwd });

  let workspacesPackageJsons = {};

  for (let workspace of workspaces) {
    let packageJson;

    try {
      packageJson = await readJson(path.join(workspaceCwd, workspace, 'package.json'));
    } catch (err) {
      // ignore empty folders
      continue;
    }

    workspacesPackageJsons[workspace] = packageJson;
  }

  let workspaceMeta = buildDepGraphFromObject({
    workspaceCwd,
    workspacePackageJson,
    workspacesPackageJsons,
    ...options,
  });

  return workspaceMeta;
}

function buildDepGraphFromObject({
  workspaceCwd,
  workspacePackageJson,
  workspacesPackageJsons,
  shouldPruneDeps = true,
}) {
  let workspaceMeta = {
    cwd: workspaceCwd,
  };

  firstPass(workspaceMeta, workspacePackageJson, workspacesPackageJsons);
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
  buildDepGraphFromObject,
  collectPackages,
});
