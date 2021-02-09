'use strict';

const path = require('path');
const writeJson = require('./json').write;
const semver = require('semver');
const inquirer = require('inquirer');
const buildDepGraph = require('./build-dep-graph');
const buildDAG = require('./build-dag');
const dependencyTypes = require('./dependency-types');
const {
  getWorkspaceCwd,
} = require('./git');

function updateDependencyVersion(packageJson, name) {
  for (let type of dependencyTypes) {
    let deps = packageJson[type];

    for (let _name in deps) {
      if (_name !== name) {
        continue;
      }

      deps[name] = deps[name].replace(/ +\|\| +[\d.]*-detached.*/, '');

      break;
    }
  }
}

async function detach({
  package: _package,
  cwd = process.cwd(),
}) {
  let myPackageJsonPath = path.join(cwd, 'package.json');
  let myPackageJson = require(myPackageJsonPath);

  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({ workspaceCwd });

  if (_package) {
    let otherPackageCwd = Object.values(workspaceMeta.packages).find(({ cwd }) => path.basename(cwd) === _package).cwd;

    let otherPackageJsonPath = path.join(otherPackageCwd, 'package.json');
    let otherPackageJson = require(otherPackageJsonPath);

    updateDependencyVersion(myPackageJson, otherPackageJson.name);
  } else {
    let dag = buildDAG(workspaceMeta, myPackageJson.name);

    let { major, minor, patch } = semver.parse(myPackageJson.version);

    // don't mutate package.json until after DAG is built
    myPackageJson.version = `${major}.${minor}.${patch}-detached`;

    if (dag.dependents.length) {
      // include space as to never match a similarly named package
      let workspaceKey = 'Workspace Root';

      let choices = dag.dependents.map(dependent => {
        return dependent.packageName || path.basename(dependent.cwd);
      });

      let { answers } = await inquirer.prompt([{
        type: 'checkbox',
        message: 'Would you like to attach any of these dependents to this newly detached package while you\'re at it?',
        name: 'answers',
        choices,
      }]);

      let dependencts = answers.map(answer => {
        // switch to key/value instead of array?
        let isPackage = answer !== workspaceKey;

        return dag.dependents.find(dependent => {
          return isPackage ? dependent.packageName === answer : !dependent.isPackage;
        });
      });

      // prevent loops
      const attach = require('./attach');

      for (let node of dependencts) {
        await attach({
          package: path.basename(cwd),
          cwd: node.cwd,
        });
      }
    }
  }

  await writeJson(myPackageJsonPath, myPackageJson);
}

module.exports = detach;
