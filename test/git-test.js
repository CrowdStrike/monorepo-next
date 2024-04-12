'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const { git } = require('../src/git');
const execa = require('execa');
const { gitInit } = require('git-fixtures');

describe(function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit({
      defaultBranchName: 'master',
    });
  });

  describe(git, function() {
    describe('cached', function () {
      it('works', async function() {
        let oldSha = await git(['rev-parse', 'HEAD'], {
          cwd: tmpPath,
          cached: true,
        });

        await execa('git', ['commit', '-m', 'test', '--allow-empty'], { cwd: tmpPath });

        let cachedSha = await git(['rev-parse', 'HEAD'], {
          cwd: tmpPath,
          cached: true,
        });

        let newSha = await execa('git', ['rev-parse', 'HEAD'], {
          cwd: tmpPath,
        });

        expect(cachedSha).to.equal(oldSha);
        expect(newSha).to.not.equal(oldSha);
      });
    });
  });
});
