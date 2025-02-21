'use strict';

const { describe, it, setUpSinon } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const _updateDistTag = require('../src/update-dist-tag');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');

describe(_updateDistTag, function() {
  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpSinon();

  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit();
  });

  async function updateDistTag(options) {
    await _updateDistTag({
      cwd: tmpPath,
      silent: true,
      ...options,
    });
  }

  it('works', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': stringifyJson({
            'name': '@scope/package-a',
            'version': '2.0.0',
            'devDependencies': {
              '@scope/package-b': '^3.0.0',
              '@scope/package-c': '^1.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': stringifyJson({
            'name': '@scope/package-b',
            'version': '3.0.0',
            'dependencies': {
              '@scope/package-a': '^2.0.0',
            },
          }),
        },
        'package-c': {
          'package.json': stringifyJson({
            'name': '@scope/package-c',
            'version': '3.0.1',
            'dependencies': {
              '@scope/package-b': '^2.0.0',
            },
            'devDependencies': {
              '@scope/package-a': '^2.0.0',
            },
          }),
        },
        'my-app': {
          'package.json': stringifyJson({
            'name': 'my-app',
            'private': true,
            'version': '1.0.1',
            'devDependencies': {
              '@scope/package-a': '^2.0.0',
              '@scope/package-b': '^2.0.0',
              '@scope/package-c': '^3.0.1',
            },
          }),
        },
      },
      'package.json': stringifyJson({
        'private': true,
        'workspaces': [
          'packages/*',
        ],
        'devDependencies': {
          '@scope/package-a': '^2.0.0',
          '@scope/package-b': '^1.0.0',
        },
      }),
    });

    let tags = [
      '@scope/package-a@2.0.0',
      '@scope/package-b@3.0.0',
      '@scope/package-c@3.0.1',
      'my-app@1.0.1',
    ];

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', `chore(release): ${tags.join(',')}`], { cwd: tmpPath });

    for (let tag of tags) {
      await execa('git', ['tag', tag], { cwd: tmpPath });
    }

    let updateDistTagOverride = this.spy();

    await updateDistTag({
      updateDistTagOverride,
    });

    expect(updateDistTagOverride).to.have.callCount(3);
    expect(updateDistTagOverride.args[0][0]?.cwd).to.equal(tmpPath);
    expect(updateDistTagOverride.args[0][0]?.originalUpdateDistTag).to.be.a('function');
    expect(updateDistTagOverride.args[0][0]?.tag).to.equal('@scope/package-a@2.0.0');
    expect(updateDistTagOverride.args[0][0]?.distTag).to.equal('latest');
    expect(updateDistTagOverride.args[0][0]?.dryRun).to.equal(false);
    expect(updateDistTagOverride.args[1][0]?.cwd).to.equal(tmpPath);
    expect(updateDistTagOverride.args[1][0]?.originalUpdateDistTag).to.be.a('function');
    expect(updateDistTagOverride.args[1][0]?.tag).to.equal('@scope/package-b@3.0.0');
    expect(updateDistTagOverride.args[1][0]?.distTag).to.equal('latest');
    expect(updateDistTagOverride.args[1][0]?.dryRun).to.equal(false);
    expect(updateDistTagOverride.args[2][0]?.cwd).to.equal(tmpPath);
    expect(updateDistTagOverride.args[2][0]?.originalUpdateDistTag).to.be.a('function');
    expect(updateDistTagOverride.args[2][0]?.tag).to.equal('@scope/package-c@3.0.1');
    expect(updateDistTagOverride.args[2][0]?.distTag).to.equal('latest');
    expect(updateDistTagOverride.args[2][0]?.dryRun).to.equal(false);
  });
});
