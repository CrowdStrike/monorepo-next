'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const path = require('path');
const sinon = require('sinon');
const buildDepGraph = require('../src/build-dep-graph');
const buildDAG = require('../src/build-dag');
const { matchPath } = require('./helpers/matchers');
const { createTmpDir } = require('./helpers/tmp');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;

let cwd = path.resolve(__dirname, './fixtures/workspace');

describe(buildDAG, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await createTmpDir();
  });

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

  it('allows empty string version ranges', async function() {
    let packageName = '@scope/package-a';

    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': packageName,
            'version': '1.0.0',
          }),
        },
      },
      'package.json': stringifyJson({
        'private': true,
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          [packageName]: '',
        },
      }),
    });

    let dag = buildDAG(await buildDepGraph(tmpPath), packageName);

    expect(dag).to.deep.equal({
      isPackage: true,
      cwd: path.join(tmpPath, 'packages/package-a'),
      packageName,
      version: '1.0.0',
      branch: [],
      isCycle: false,
      dependents: [
        {
          isPackage: false,
          cwd: tmpPath,
          packageName: 'Workspace Root',
          version: undefined,
          dependencyType: 'devDependencies',
          dependencyRange: '',
          branch: [
            packageName,
          ],
          dependents: [],
        },
      ],
    });
  });
});
