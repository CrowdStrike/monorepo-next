'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const { getCycles } = require('../src/cycle');
const { buildDepGraphFromObject } = require('../src/build-dep-graph');

function normalize(packages) {
  return buildDepGraphFromObject({
    workspaceCwd: '/root',
    workspacePackageJson: {},
    workspacesPackageJsons: Object.entries(packages).reduce((packages, [name, pkg]) => {
      Object.assign(pkg, { name });

      return packages;
    }, packages),
  });
}

describe(function() {
  describe(getCycles, function() {
    it('detects circular references', async function() {
      let workspaceMeta = normalize({
        packageA: {
          version: '0.0.0',
          dependencies: {
            packageB: '0.0.0',
          },
        },
        packageB: {
          version: '0.0.0',
          dependencies: {
            packageA: '0.0.0',
          },
        },
      });

      let cycles = await getCycles(workspaceMeta);

      expect(cycles).to.deep.equal([
        'packageA < dependencies < packageB < dependencies < packageA',
      ]);
    });

    describe('devDependencies', function() {
      let workspaceMeta;

      beforeEach(function() {
        workspaceMeta = normalize({
          packageA: {
            version: '0.0.0',
            dependencies: {
              packageB: '0.0.0',
            },
          },
          packageB: {
            version: '0.0.0',
            devDependencies: {
              packageA: '0.0.0',
            },
          },
        });
      });

      it('doesn\'t detect circular references by default', async function() {
        let cycles = await getCycles(workspaceMeta);

        expect(cycles).to.deep.equal([]);
      });

      it('detects circular references if enabled', async function() {
        let cycles = await getCycles(workspaceMeta, {
          shouldDetectDevDependencies: true,
        });

        expect(cycles).to.deep.equal([
          'packageA < dependencies < packageB < devDependencies < packageA',
        ]);
      });

      it('is deterministic when packages not alphabetized', async function() {
        let workspaceMeta = normalize({
          packageB: {
            version: '0.0.0',
            dependencies: {
              packageA: '0.0.0',
            },
          },
          packageA: {
            version: '0.0.0',
            dependencies: {
              packageB: '0.0.0',
            },
          },
        });

        let cycles = await getCycles(workspaceMeta);

        expect(cycles).to.deep.equal([
          'packageA < dependencies < packageB < dependencies < packageA',
        ]);
      });

      it('is deterministic when dependencies not alphabetized', async function() {
        let workspaceMeta = normalize({
          packageA: {
            version: '0.0.0',
            dependencies: {
              packageC: '0.0.0',
              packageB: '0.0.0',
            },
          },
          packageB: {
            version: '0.0.0',
            dependencies: {
              packageA: '0.0.0',
            },
          },
          packageC: {
            version: '0.0.0',
            dependencies: {
              packageA: '0.0.0',
            },
          },
        });

        let cycles = await getCycles(workspaceMeta);

        expect(cycles).to.deep.equal([
          'packageA < dependencies < packageB < dependencies < packageA',
          'packageA < dependencies < packageC < dependencies < packageA',
        ]);
      });
    });
  });

  it('ignores the dependency type just outside the loop', async function() {
    let workspaceMeta = normalize({
      packageA: {
        version: '0.0.0',
        dependencies: {
          packageB: '0.0.0',
        },
      },
      packageB: {
        version: '0.0.0',
        dependencies: {
          packageC: '0.0.0',
        },
      },
      packageC: {
        version: '0.0.0',
        dependencies: {
          packageB: '0.0.0',
        },
      },
    });

    let cycles = await getCycles(workspaceMeta);

    expect(cycles).to.deep.equal([
      'packageB < dependencies < packageC < dependencies < packageB',
    ]);
  });
});
