'use strict';

const { describe, it, setUpSinon } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const path = require('path');
const buildDepGraph = require('../src/build-dep-graph');
const buildDAG = require('../src/build-dag');
const { matchPath } = require('./helpers/matchers');
const { createTmpDir } = require('../src/tmp');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;

let cwd = path.resolve(__dirname, './fixtures/workspace');

describe(buildDAG, function() {
  let tmpPath;

  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpSinon();

  beforeEach(async function() {
    tmpPath = await createTmpDir();
  });

  it('package-a', async function() {
    let _package = '@scope/package-a';

    let dag = buildDAG(await buildDepGraph({ workspaceCwd: cwd }), _package);

    expect(dag).to.match(this.match({
      parent: undefined,
      dependencyType: undefined,
      dependencyRange: undefined,
      isCycle: false,
      node: {
        isPackage: true,
        cwd: matchPath('/workspace/packages/package-a'),
        packageName: '@scope/package-a',
        version: '1.0.0',
        dependents: [
          this.match({
            parent: {
              node: {
                packageName: '@scope/package-a',
              },
            },
            dependencyType: 'dependencies',
            dependencyRange: '^1.0.0',
            isCycle: false,
            node: {
              isPackage: true,
              cwd: matchPath('/workspace/packages/package-b'),
              packageName: '@scope/package-b',
              version: '2.0.0',
              dependents: [
                this.match({
                  parent: {
                    node: {
                      packageName: '@scope/package-b',
                    },
                  },
                  dependencyType: 'devDependencies',
                  dependencyRange: '^2.0.0',
                  isCycle: true,
                  node: {
                    isPackage: true,
                    cwd: matchPath('/workspace/packages/package-a'),
                    packageName: '@scope/package-a',
                    version: '1.0.0',
                  },
                }),
                this.match({
                  parent: {
                    node: {
                      packageName: '@scope/package-b',
                    },
                  },
                  dependencyType: 'dependencies',
                  dependencyRange: '^2.0.0',
                  isCycle: false,
                  node: {
                    isPackage: true,
                    cwd: matchPath('/workspace/packages/package-c'),
                    packageName: '@scope/package-c',
                    version: '3.0.0',
                  },
                }),
              ],
            },
          }),
          this.match({
            parent: {
              node: {
                packageName: '@scope/package-a',
              },
            },
            dependencyType: 'optionalDependencies',
            dependencyRange: '^1.0.0',
            isCycle: false,
            node: {
              isPackage: true,
              cwd: matchPath('/workspace/packages/package-c'),
              packageName: '@scope/package-c',
              version: '3.0.0',
            },
          }),
          this.match({
            parent: {
              node: {
                packageName: '@scope/package-a',
              },
            },
            dependencyType: 'devDependencies',
            dependencyRange: '^1.0.0',
            isCycle: false,
            node: {
              isPackage: false,
              cwd: matchPath('/workspace'),
              packageName: 'Workspace Root',
              version: undefined,
            },
          }),
        ],
      },
    }));
  });

  it('package-b', async function() {
    let _package = '@scope/package-b';

    let dag = buildDAG(await buildDepGraph({ workspaceCwd: cwd }), _package);

    expect(dag).to.match(this.match({
      parent: undefined,
      dependencyType: undefined,
      dependencyRange: undefined,
      isCycle: false,
      node: {
        isPackage: true,
        cwd: matchPath('/workspace/packages/package-b'),
        packageName: '@scope/package-b',
        version: '2.0.0',
        dependents: [
          this.match({
            parent: {
              node: {
                packageName: '@scope/package-b',
              },
            },
            dependencyType: 'devDependencies',
            dependencyRange: '^2.0.0',
            isCycle: false,
            node: {
              isPackage: true,
              cwd: matchPath('/workspace/packages/package-a'),
              packageName: '@scope/package-a',
              version: '1.0.0',
              dependents: [
                this.match({
                  parent: {
                    node: {
                      packageName: '@scope/package-a',
                    },
                  },
                  dependencyType: 'dependencies',
                  dependencyRange: '^1.0.0',
                  isCycle: true,
                  node: {
                    isPackage: true,
                    cwd: matchPath('/workspace/packages/package-b'),
                    packageName: '@scope/package-b',
                    version: '2.0.0',
                  },
                }),
                this.match({
                  parent: {
                    node: {
                      packageName: '@scope/package-a',
                    },
                  },
                  dependencyType: 'optionalDependencies',
                  dependencyRange: '^1.0.0',
                  isCycle: false,
                  node: {
                    isPackage: true,
                    cwd: matchPath('/workspace/packages/package-c'),
                    packageName: '@scope/package-c',
                    version: '3.0.0',
                  },
                }),
                this.match({
                  parent: {
                    node: {
                      packageName: '@scope/package-a',
                    },
                  },
                  dependencyType: 'devDependencies',
                  dependencyRange: '^1.0.0',
                  isCycle: false,
                  node: {
                    isPackage: false,
                    cwd: matchPath('/workspace'),
                    packageName: 'Workspace Root',
                    version: undefined,
                  },
                }),
              ],
            },
          }),
          this.match({
            parent: {
              node: {
                packageName: '@scope/package-b',
              },
            },
            dependencyType: 'dependencies',
            dependencyRange: '^2.0.0',
            isCycle: false,
            node: {
              isPackage: true,
              cwd: matchPath('/workspace/packages/package-c'),
              packageName: '@scope/package-c',
              version: '3.0.0',
            },
          }),
        ],
      },
    }));
  });

  it('package-c', async function() {
    let _package = '@scope/package-c';

    let dag = buildDAG(await buildDepGraph({ workspaceCwd: cwd }), _package);

    expect(dag).to.match(this.match({
      parent: undefined,
      dependencyType: undefined,
      dependencyRange: undefined,
      isCycle: false,
      node: {
        isPackage: true,
        cwd: matchPath('/workspace/packages/package-c'),
        packageName: '@scope/package-c',
        version: '3.0.0',
        dependents: [],
      },
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

    let dag = buildDAG(await buildDepGraph({ workspaceCwd: tmpPath }), packageName);

    expect(dag).to.match(this.match({
      node: {
        packageName,
        version: '1.0.0',
        dependents: [
          this.match({
            parent: {
              node: {
                packageName,
              },
            },
            dependencyType: 'devDependencies',
            dependencyRange: '',
            node: {
              packageName: 'Workspace Root',
            },
          }),
        ],
      },
    }));
  });

  it('chains private packages', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
            'private': true,
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': 'package-b',
            'version': '1.0.0',
            'private': true,
            'dependencies': {
              'package-a': '',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': 'package-c',
            'version': '1.0.0',
            'private': true,
            'dependencies': {
              'package-b': '',
            },
          }),
        },
      },
      'package.json': stringifyJson({
        'private': true,
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    let dag = buildDAG(await buildDepGraph({ workspaceCwd: tmpPath }), 'package-a');

    expect(dag).to.match(this.match({
      node: {
        packageName: 'package-a',
        dependents: [
          this.match({
            parent: {
              node: {
                packageName: 'package-a',
              },
            },
            dependencyType: 'dependencies',
            dependencyRange: '',
            node: {
              packageName: 'package-b',
              dependents: [
                this.match({
                  parent: {
                    node: {
                      packageName: 'package-b',
                    },
                  },
                  dependencyType: 'dependencies',
                  dependencyRange: '',
                  node: {
                    packageName: 'package-c',
                  },
                }),
              ],
            },
          }),
        ],
      },
    }));
  });
});
