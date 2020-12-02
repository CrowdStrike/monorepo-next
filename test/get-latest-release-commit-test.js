'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const getLatestReleaseCommit = require('../src/get-latest-release-commit');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');
const {
  getCurrentCommit,
} = require('./helpers/git');

describe(getLatestReleaseCommit, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit();
  });

  it('works', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'package.json': stringifyJson({
            'name': '@scope/my-app',
            'version': '1.0.0',
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'chore: release'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/my-app@1.0.0'], { cwd: tmpPath });

    let commit = await getCurrentCommit(tmpPath);

    let latestReleaseCommit = await getLatestReleaseCommit({
      cwd: tmpPath,
      packageName: '@scope/my-app',
    });

    expect(latestReleaseCommit).to.equal(commit);
  });

  it('works without tag', async function() {
    let commit = await getCurrentCommit(tmpPath);

    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'package.json': stringifyJson({
            'name': '@scope/my-app',
            'version': '1.0.0',
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'chore: release'], { cwd: tmpPath });

    let latestReleaseCommit = await getLatestReleaseCommit({
      cwd: tmpPath,
      packageName: '@scope/my-app',
    });

    expect(latestReleaseCommit).to.equal(commit);
  });

  it('works detached', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'my-app': {
          'package.json': stringifyJson({
            'name': '@scope/my-app',
            'version': '1.0.0-detached',
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

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'chore: release'], { cwd: tmpPath });
    await execa('git', ['tag', '@scope/my-app@1.0.0'], { cwd: tmpPath });

    let commit = await getCurrentCommit(tmpPath);

    let latestReleaseCommit = await getLatestReleaseCommit({
      cwd: tmpPath,
      packageName: '@scope/my-app',
    });

    expect(latestReleaseCommit).to.equal(commit);
  });
});
