'use strict';

const path = require('path');
const writeJson = require('./json').write;
const buildDepGraph = require('./build-dep-graph');
const buildDAG = require('./build-dag');
const dependencyTypes = require('./dependency-types');
const {
  getWorkspaceCwd,
} = require('./git');

function updateDependencyVersion(packageJson, name, version) {
  for (let type of dependencyTypes) {
    let deps = packageJson[type];

    for (let _name in deps) {
      if (_name !== name) {
        continue;
      }

      deps[name] += ` || ${version}`;

      break;
    }
  }
}

async function detachDependents(dag) {
  // prevent loops
  const detach = require('./detach');

  for (let group of dag.node.dependents) {
    await detach({
      package: path.basename(dag.node.cwd),
      cwd: group.node.cwd,
    });

    if (group.node.isPackage) {
      await attach({
        cwd: group.node.cwd,
        dag: group,
      });
    }
  }
}

async function attach({
  package: _package,
  cwd = process.cwd(),
  dag,
}) {
  let myPackageJsonPath = path.join(cwd, 'package.json');
  let myPackageJson = require(myPackageJsonPath);

  if (_package) {
    let workspaceCwd = await getWorkspaceCwd(cwd);

    let workspaceMeta = await buildDepGraph({ workspaceCwd });

    let otherPackageCwd = Object.values(workspaceMeta.packages).find(({ cwd }) => path.basename(cwd) === _package).cwd;

    // 'packages' is brittle and will need to be changed
    let otherPackageJsonPath = path.join(otherPackageCwd, 'package.json');
    let otherPackageJson = require(otherPackageJsonPath);

    updateDependencyVersion(myPackageJson, otherPackageJson.name, otherPackageJson.version);
  } else {
    let matches = myPackageJson.version.match(/(.*)-detached.*/);

    if (!matches) {
      // not detached, nothing to do
      return;
    }

    if (!dag) {
      let workspaceCwd = await getWorkspaceCwd(cwd);

      let workspaceMeta = await buildDepGraph({ workspaceCwd });

      dag = buildDAG(workspaceMeta, myPackageJson.name);
    }

    // don't mutate package.json until after DAG is built
    myPackageJson.version = matches[1];

    if (!dag.isCycle) {
      await detachDependents(dag);
    }
  }

  await writeJson(myPackageJsonPath, myPackageJson);
}

module.exports = attach;
