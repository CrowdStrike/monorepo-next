'use strict';

const { describe, it, setUpSinon } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const defrag = require('../src/defrag');
const {
  collectAllRanges,
  filterRangeUpdates,
  applyRangeUpdates,
} = defrag;
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const { gitInit } = require('git-fixtures');
const dependencyTypes = require('../src/dependency-types');
const readWorkspaces = require('./helpers/read-workspaces');

function normalize(workspaceMeta) {
  for (let [packageName, _package] of [...Object.entries(workspaceMeta.packages), ['', workspaceMeta]]) {
    _package.packageName = packageName;

    for (let dependencyType of dependencyTypes) {
      if (!_package[dependencyType]) {
        _package[dependencyType] = {};
      }
    }
  }

  return workspaceMeta;
}

describe(function() {
  describe(collectAllRanges, function() {
    it('works', function() {
      let workspaceMeta = normalize({
        devDependencies: {
          packageB: '^1.0.0',
        },
        packages: {
          packageA: {
            dependencies: {
              packageB: '^2.0.0',
            },
          },
        },
      });

      let allRanges = collectAllRanges(workspaceMeta);

      expect(allRanges).to.deep.equal({
        packageB: [
          '^2.0.0',
          '^1.0.0',
        ],
      });
    });

    it('can filter by included packages', function() {
      let workspaceMeta = normalize({
        devDependencies: {
          packageB: '^1.0.0',
          packageC: '~2.0.0',
        },
        packages: {
          packageA: {
            dependencies: {
              packageB: '^1.0.1',
              packageC: '~2.0.1',
            },
          },
        },
      });

      let allRanges = collectAllRanges(workspaceMeta, {
        include: [
          'packageB',
        ],
      });

      expect(allRanges).to.deep.equal({
        packageB: [
          '^1.0.1',
          '^1.0.0',
        ],
      });
    });

    it('can filter by excluded packages', function() {
      let workspaceMeta = normalize({
        devDependencies: {
          packageB: '^1.0.0',
          packageC: '~2.0.0',
        },
        packages: {
          packageA: {
            dependencies: {
              packageB: '^1.0.1',
              packageC: '~2.0.1',
            },
          },
        },
      });

      let allRanges = collectAllRanges(workspaceMeta, {
        exclude: [
          'packageB',
        ],
      });

      expect(allRanges).to.deep.equal({
        packageC: [
          '~2.0.1',
          '~2.0.0',
        ],
      });
    });
  });

  describe(filterRangeUpdates, function() {
    it('works', function() {
      let allRanges = {
        packageA: [
          '^1.0.1',
          '^1.0.0',
          '^2.0.0',
        ],
        packageB: [
          '^2.0.0',
          '^1.0.0',
        ],
        packageC: [
          '^2.0.0',
          '^2.0.1',
          '^1.1.0',
          '^1.2.0',
        ],
        packageD: [
          '2.0.0',
          '2.0.1',
          '~1.1.0',
          '~1.2.0',
        ],
        packageE: [
          '1.0.0',
          '*',
        ],
      };

      let rangeUpdates = filterRangeUpdates(allRanges);

      expect(rangeUpdates).to.deep.equal({
        packageA: {
          '^1.0.0': '^1.0.1',
        },
        packageC: {
          '^1.1.0': '^1.2.0',
          '^2.0.0': '^2.0.1',
        },
      });
    });

    it('ignores invalid semver strings', function() {
      let allRanges = {
        packageA: [
          'git+ssh://git@foo.bar/#v1.0.0',
          '^1.0.1',
        ],
      };

      let rangeUpdates = filterRangeUpdates(allRanges);

      expect(rangeUpdates).to.deep.equal({});
    });

    it('can include out of range patches', function() {
      let allRanges = {
        packageA: [
          '1.0.0',
          '1.0.1',
        ],
      };

      let rangeUpdates = filterRangeUpdates(allRanges, {
        outOfRange: 'patch',
      });

      expect(rangeUpdates).to.deep.equal({
        packageA: {
          '1.0.0': '1.0.1',
        },
      });
    });

    it('can include out of range minors', function() {
      let allRanges = {
        packageA: [
          '~1.0.0',
          '~1.1.0',
        ],
      };

      let rangeUpdates = filterRangeUpdates(allRanges, {
        outOfRange: 'minor',
      });

      expect(rangeUpdates).to.deep.equal({
        packageA: {
          '~1.0.0': '~1.1.0',
        },
      });
    });

    it('can include out of range majors', function() {
      let allRanges = {
        packageA: [
          '^1.0.0',
          '^2.0.0',
        ],
      };

      let rangeUpdates = filterRangeUpdates(allRanges, {
        outOfRange: 'major',
      });

      expect(rangeUpdates).to.deep.equal({
        packageA: {
          '^1.0.0': '^2.0.0',
        },
      });
    });

    it('ignores whitespace', function() {
      let allRanges = {
        packageA: [
          '^1.0.0',
          '^1.0.0 ',
        ],
      };

      let rangeUpdates = filterRangeUpdates(allRanges);

      expect(rangeUpdates).to.deep.equal({});
    });

    it('ignores catch-all ranges', function() {
      let allRanges = {
        packageA: [
          '1.0.0',
          '*',
          '',
        ],
      };

      let rangeUpdates = filterRangeUpdates(allRanges);

      expect(rangeUpdates).to.deep.equal({});
    });
  });

  describe(applyRangeUpdates, function() {
    // eslint-disable-next-line mocha/no-setup-in-describe
    setUpSinon();

    it('works', function() {
      let workspaceMeta = normalize({
        devDependencies: {
          packageB: '^1.0.0',
        },
        packages: {
          packageA: {
            dependencies: {
              packageB: '^1.0.1',
            },
          },
        },
      });

      let rangeUpdates = {
        packageB: {
          '^1.0.0': '^1.0.1',
        },
      };

      applyRangeUpdates(workspaceMeta, rangeUpdates);

      expect(workspaceMeta).to.match(this.match({
        devDependencies: {
          packageB: '^1.0.1',
        },
        packages: {
          packageA: {
            dependencies: {
              packageB: '^1.0.1',
            },
          },
        },
      }));
    });

    it('can perform a dry run', function() {
      let workspaceMeta = normalize({
        devDependencies: {
          packageB: '^1.0.1',
        },
        packages: {
          packageA: {
            dependencies: {
              packageB: '^1.0.0',
            },
          },
        },
      });

      let rangeUpdates = {
        packageB: {
          '^1.0.0': '^1.0.1',
        },
      };

      let log = this.stub(console, 'log');

      applyRangeUpdates(workspaceMeta, rangeUpdates, {
        dryRun: true,
      });

      expect(log).to.have.callCount(1);
      expect(log).to.be.calledWith('packageA.dependencies.packageB: ^1.0.0 -> ^1.0.1');

      expect(workspaceMeta).to.match(this.match({
        devDependencies: {
          packageB: '^1.0.1',
        },
        packages: {
          packageA: {
            dependencies: {
              packageB: '^1.0.0',
            },
          },
        },
      }));
    });
  });

  describe(defrag, function() {
    let tmpPath;

    beforeEach(async function() {
      tmpPath = await gitInit();
    });

    it('works', async function() {
      fixturify.writeSync(tmpPath, {
        'packages': {
          'package-a': {
            'package.json': stringifyJson({
              'name': 'package-a',
              'version': '1.0.0',
              'devDependencies': {
                'package-b': '^1.0.0',
                'package-c': '^1.0.0',
                'package-d': '^1.0.0',
                'package-e': '^2.0.0',
              },
            }),
          },
        },
        'package.json': stringifyJson({
          'private': true,
          'workspaces': [
            'packages/*',
          ],
          'dependencies': {
            'package-b': '^1.0.1',
            'package-c': '^1.0.0',
            'package-d': '^2.0.0',
            'package-e': '^2.1.0',
          },
        }),
      });

      await defrag({
        cwd: tmpPath,
      });

      let workspace = readWorkspaces(tmpPath);

      expect(workspace).to.deep.equal({
        'packages': {
          'package-a': {
            'package.json': stringifyJson({
              'name': 'package-a',
              'version': '1.0.0',
              'devDependencies': {
                'package-b': '^1.0.1',
                'package-c': '^1.0.0',
                'package-d': '^1.0.0',
                'package-e': '^2.1.0',
              },
            }),
          },
        },
        'package.json': stringifyJson({
          'private': true,
          'workspaces': [
            'packages/*',
          ],
          'dependencies': {
            'package-b': '^1.0.1',
            'package-c': '^1.0.0',
            'package-d': '^2.0.0',
            'package-e': '^2.1.0',
          },
        }),
      });
    });
  });
});
