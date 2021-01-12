'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const getNewVersions = require('../src/get-new-versions');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');

describe(getNewVersions, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit();
  });

  it('works with monorepo version', async function() {
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
        'name': 'my-monorepo',
        'version': '2.1.1',
        'private': true,
        'workspaces': [
          'packages/*',
        ],
      }),
    });

    await execa('git', ['add', '.'], { cwd: tmpPath });
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let newVersions = await getNewVersions({
      cwd: tmpPath,
    });

    expect(newVersions).to.deep.equal({
      '@scope/my-app': {
        oldVersion: '1.0.0',
        releaseType: 'minor',
        newVersion: '1.1.0',
      },
      'my-monorepo': {
        oldVersion: '2.1.1',
        releaseType: 'minor',
        newVersion: '2.2.0',
      },
    });
  });

  it('works without monorepo version', async function() {
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
    await execa('git', ['commit', '-m', 'feat: foo'], { cwd: tmpPath });

    let newVersions = await getNewVersions({
      cwd: tmpPath,
    });

    expect(newVersions).to.deep.equal({
      '@scope/my-app': {
        oldVersion: '1.0.0',
        releaseType: 'minor',
        newVersion: '1.1.0',
      },
    });
  });
});
