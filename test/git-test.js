'use strict';

const { describe, it, setUpTmpDir } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const { git, getCacheKey } = require('../src/git');
const execa = require('execa');
const { gitInit } = require('git-fixtures');
const path = require('path');
const fs = require('fs');

describe(function() {
  let cwd;

  beforeEach(async function() {
    cwd = await gitInit({
      defaultBranchName: 'master',
    });
  });

  describe(git, function() {
    describe('cached', function () {
      describe('in memory', function () {
        it('works', async function() {
          let oldSha = await git(['rev-parse', 'HEAD'], {
            cwd,
            cached: true,
          });

          await execa('git', ['commit', '-m', 'test', '--allow-empty'], { cwd });

          let cachedSha = await git(['rev-parse', 'HEAD'], {
            cwd,
            cached: true,
          });

          let newSha = await execa('git', ['rev-parse', 'HEAD'], {
            cwd,
          });

          expect(cachedSha).to.equal(oldSha);
          expect(newSha).to.not.equal(oldSha);
        });

        describe('exit code commands', function () {
          const shouldUseExitCode = true;

          it('true', async function() {
            let oldSha = await git(['rev-parse', 'HEAD'], {
              cwd,
            });

            await execa('git', ['commit', '-m', 'test', '--allow-empty'], { cwd });

            let newSha = await execa('git', ['rev-parse', 'HEAD'], {
              cwd,
            });

            let cachedArgs = ['merge-base', '--is-ancestor', oldSha, newSha.stdout];

            let result = await git(cachedArgs, {
              cwd,
              cached: true,
              shouldUseExitCode,
            });

            expect(result).to.equal(true);

            await execa('git', ['reset', '--hard', oldSha], { cwd });
            await execa('git', ['reflog', 'expire', '--expire=now', '--all'], { cwd });
            await execa('git', ['gc', '--prune=now'], { cwd });

            result = await git(cachedArgs, {
              cwd,
              cached: true,
              shouldUseExitCode,
            });

            expect(result).to.equal(true);

            result = await git(cachedArgs, {
              cwd,
              shouldUseExitCode,
            });

            expect(result).to.equal(false);

          });

          it('false', async function() {
            let cachedArgs = ['rev-parse', 'non-existent-branch'];

            let result = await git(cachedArgs, {
              cwd,
              cached: true,
              shouldUseExitCode,
            });

            expect(result).to.equal(false);

            await execa('git', ['branch', 'non-existent-branch'], { cwd });

            result = await git(cachedArgs, {
              cwd,
              cached: true,
              shouldUseExitCode,
            });

            expect(result).to.equal(false);

            result = await git(cachedArgs, {
              cwd,
              shouldUseExitCode,
            });

            expect(result).to.equal(true);
          });
        });
      });

      describe('on disk', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        setUpTmpDir();

        it('works', async function() {
          let oldSha = await git(['rev-parse', 'HEAD'], {
            cwd,
            cached: this.tmpPath,
          });

          await execa('git', ['commit', '-m', 'test', '--allow-empty'], { cwd });

          let cachedSha = await git(['rev-parse', 'HEAD'], {
            cwd,
            cached: this.tmpPath,
          });

          let newSha = await execa('git', ['rev-parse', 'HEAD'], {
            cwd,
          });

          expect(cachedSha).to.equal(oldSha);
          expect(newSha).to.not.equal(oldSha);

          let [cachedFilePath] = await fs.promises.readdir(this.tmpPath);

          expect(cachedFilePath).to.equal(getCacheKey(['rev-parse', 'HEAD'], cwd));
          expect(path.join(this.tmpPath, cachedFilePath)).to.be.a.file().with.content(oldSha);
        });

        describe('exit code commands', function () {
          const shouldUseExitCode = true;

          it('true', async function() {
            let oldSha = await git(['rev-parse', 'HEAD'], {
              cwd,
            });

            await execa('git', ['commit', '-m', 'test', '--allow-empty'], { cwd });

            let newSha = await execa('git', ['rev-parse', 'HEAD'], {
              cwd,
            });

            let args = ['merge-base', '--is-ancestor', oldSha, newSha.stdout];

            await git(args, {
              cwd,
              cached: this.tmpPath,
              shouldUseExitCode,
            });

            let [cachedFilePath] = await fs.promises.readdir(this.tmpPath);

            expect(cachedFilePath).to.equal(getCacheKey(args, cwd));
            expect(path.join(this.tmpPath, cachedFilePath)).to.be.a.file().with.content('true');
          });

          it('false', async function() {
            let oldSha = await git(['rev-parse', 'HEAD'], {
              cwd,
            });

            await execa('git', ['commit', '-m', 'test', '--allow-empty'], { cwd });

            let newSha = await execa('git', ['rev-parse', 'HEAD'], {
              cwd,
            });

            let args = ['merge-base', '--is-ancestor', newSha.stdout, oldSha];

            await git(args, {
              cwd,
              cached: this.tmpPath,
              shouldUseExitCode,
            });

            let [cachedFilePath] = await fs.promises.readdir(this.tmpPath);

            expect(cachedFilePath).to.equal(getCacheKey(args, cwd));
            expect(path.join(this.tmpPath, cachedFilePath)).to.be.a.file().with.content('false');
          });

          it('error', async function() {
            let sha = await git(['rev-parse', 'HEAD'], {
              cwd,
            });

            let args = ['merge-base', '--is-ancestor', 'missing-commit', sha];

            await git(args, {
              cwd,
              cached: this.tmpPath,
              shouldUseExitCode,
            });

            let [cachedFilePath] = await fs.promises.readdir(this.tmpPath);

            expect(cachedFilePath).to.equal(getCacheKey(args, cwd));
            expect(path.join(this.tmpPath, cachedFilePath)).to.be.a.file().with.content('false');
          });
        });
      });
    });
  });
});
