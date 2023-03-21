'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const detectCircularReferences = require('../src/detect-circular-references');
const { gitInit } = require('git-fixtures');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;

describe(detectCircularReferences, function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit();
  });

  it('works', async function() {
    fixturify.writeSync(tmpPath, {
      'packages': {
        'package-a': {
          'package.json': JSON.stringify({
            'name': 'package-a',
            'version': '0.0.0',
            'dependencies': {
              'package-b': '0.0.0',
            },
          }),
        },
        'package-b': {
          'package.json': JSON.stringify({
            'name': 'package-b',
            'version': '0.0.0',
            'dependencies': {
              'package-a': '0.0.0',
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

    let cycles = await detectCircularReferences({ cwd: tmpPath });

    expect(cycles).to.deep.equal([
      'package-a < dependencies < package-b < dependencies < package-a',
    ]);
  });
});
