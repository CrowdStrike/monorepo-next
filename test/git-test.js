'use strict';

const { describe, it, setUpTmpDir } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const { git } = require('../src/git');
const execa = require('execa');
const { gitInit } = require('git-fixtures');
const path = require('path');
const fs = require('fs');

describe(function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await gitInit({
      defaultBranchName: 'master',
    });
  });

  describe(git, function() {
    describe('cached', function () {
      describe('in memory', function () {
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

      describe('on disk', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        setUpTmpDir();

        it('works', async function() {
          let oldSha = await git(['rev-parse', 'HEAD'], {
            cwd: tmpPath,
            cached: this.tmpPath,
          });

          await execa('git', ['commit', '-m', 'test', '--allow-empty'], { cwd: tmpPath });

          let cachedSha = await git(['rev-parse', 'HEAD'], {
            cwd: tmpPath,
            cached: this.tmpPath,
          });

          let newSha = await execa('git', ['rev-parse', 'HEAD'], {
            cwd: tmpPath,
          });

          expect(cachedSha).to.equal(oldSha);
          expect(newSha).to.not.equal(oldSha);

          let [cachedFilePath] = await fs.promises.readdir(this.tmpPath);

          expect(cachedFilePath).to.not.be.undefined;
          expect(path.join(this.tmpPath, cachedFilePath)).to.be.a.file().with.content(oldSha);
        });
      });
    });
  });
});
