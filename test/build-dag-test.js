'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const path = require('path');
const sinon = require('sinon');
const buildDepGraph = require('../src/build-dep-graph');
const buildDAG = require('../src/build-dag');

let cwd = path.resolve(__dirname, './fixtures/workspace');

function matchPath(p) {
  return sinon.match(path.normalize(p));
}

describe(buildDAG, function() {
  it('package-a', async function() {
    let _package = '@scope/package-a';

    let dag = buildDAG(await buildDepGraph(cwd), _package);

    expect(dag).to.match(sinon.match({
      isPackage: true,
      cwd: matchPath('/workspace/packages/package-a'),
      packageName: '@scope/package-a',
      branch: [],
      isCycle: false,
      dependents: [
        {
          isPackage: true,
          cwd: matchPath('/workspace/packages/package-b'),
          packageName: '@scope/package-b',
          version: '2.0.0',
          dependencyType: 'dependencies',
          dependencyRange: '^1.0.0',
          branch: [
            '@scope/package-a',
          ],
          isCycle: false,
          dependents: [
            {
              isPackage: true,
              cwd: matchPath('/workspace/packages/package-a'),
              packageName: '@scope/package-a',
              version: '1.0.0',
              dependencyType: 'devDependencies',
              dependencyRange: '^2.0.0',
              branch: [
                '@scope/package-a',
                '@scope/package-b',
              ],
              isCycle: true,
            },
            {
              isPackage: true,
              cwd: matchPath('/workspace/packages/package-c'),
              packageName: '@scope/package-c',
              version: '3.0.0',
              dependencyType: 'dependencies',
              dependencyRange: '^2.0.0',
              branch: [
                '@scope/package-a',
                '@scope/package-b',
              ],
              isCycle: false,
              dependents: [],
            },
          ],
        },
        {
          isPackage: true,
          cwd: matchPath('/workspace/packages/package-c'),
          packageName: '@scope/package-c',
          version: '3.0.0',
          dependencyType: 'optionalDependencies',
          dependencyRange: '^1.0.0',
          branch: [
            '@scope/package-a',
          ],
          isCycle: false,
          dependents: [],
        },
        {
          isPackage: false,
          cwd: matchPath('/workspace'),
          packageName: 'Workspace Root',
          version: undefined,
          dependencyType: 'devDependencies',
          dependencyRange: '^1.0.0',
          branch: [
            '@scope/package-a',
          ],
          dependents: [],
        },
      ],
    }));
  });

  it('package-b', async function() {
    let _package = '@scope/package-b';

    let dag = buildDAG(await buildDepGraph(cwd), _package);

    expect(dag).to.match(sinon.match({
      isPackage: true,
      cwd: matchPath('/workspace/packages/package-b'),
      packageName: '@scope/package-b',
      version: '2.0.0',
      branch: [],
      isCycle: false,
      dependents: [
        {
          isPackage: true,
          cwd: matchPath('/workspace/packages/package-a'),
          packageName: '@scope/package-a',
          version: '1.0.0',
          dependencyType: 'devDependencies',
          dependencyRange: '^2.0.0',
          branch: [
            '@scope/package-b',
          ],
          isCycle: false,
          dependents: [
            {
              isPackage: true,
              cwd: matchPath('/workspace/packages/package-b'),
              packageName: '@scope/package-b',
              version: '2.0.0',
              dependencyType: 'dependencies',
              dependencyRange: '^1.0.0',
              branch: [
                '@scope/package-b',
                '@scope/package-a',
              ],
              isCycle: true,
            },
            {
              isPackage: true,
              cwd: matchPath('/workspace/packages/package-c'),
              packageName: '@scope/package-c',
              version: '3.0.0',
              dependencyType: 'optionalDependencies',
              dependencyRange: '^1.0.0',
              branch: [
                '@scope/package-b',
                '@scope/package-a',
              ],
              isCycle: false,
              dependents: [],
            },
            {
              isPackage: false,
              cwd: matchPath('/workspace'),
              packageName: 'Workspace Root',
              version: undefined,
              dependencyType: 'devDependencies',
              dependencyRange: '^1.0.0',
              branch: [
                '@scope/package-b',
                '@scope/package-a',
              ],
              dependents: [],
            },
          ],
        },
        {
          isPackage: true,
          cwd: matchPath('/workspace/packages/package-c'),
          packageName: '@scope/package-c',
          version: '3.0.0',
          dependencyType: 'dependencies',
          dependencyRange: '^2.0.0',
          branch: [
            '@scope/package-b',
          ],
          isCycle: false,
          dependents: [],
        },
      ],
    }));
  });

  it('package-c', async function() {
    let _package = '@scope/package-c';

    let dag = buildDAG(await buildDepGraph(cwd), _package);

    expect(dag).to.match(sinon.match({
      isPackage: true,
      cwd: matchPath('/workspace/packages/package-c'),
      packageName: '@scope/package-c',
      version: '3.0.0',
      branch: [],
      isCycle: false,
      dependents: [],
    }));
  });
});
