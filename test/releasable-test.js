'use strict';

const { describe, it, setUpTmpDir } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const {
  getChangedReleasableFiles,
  packageJsonDevChangeRegex,
} = require('../src/releasable');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');
const { getCurrentCommit } = require('./helpers/git');
const { replaceJsonFile } = require('../src/fs');
const path = require('path');

describe(function() {
  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpTmpDir();

  describe(getChangedReleasableFiles, function() {
    it('works with files array', async function() {
      fixturify.writeSync(this.tmpPath, {
        'package-a': {
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
            'files': ['include.js'],
          }),
        },
      });

      let changedReleasableFiles = await getChangedReleasableFiles({
        changedFiles: [
          'package-a/exclude.js',
          'package-a/include.js',
        ],
        packageCwd: path.join(this.tmpPath, 'package-a'),
        workspacesCwd: this.tmpPath,
      });

      expect(changedReleasableFiles).to.deep.equal([
        'package-a/include.js',
      ].map(path.normalize));
    });

    it('works with npmignore', async function() {
      fixturify.writeSync(this.tmpPath, {
        'package-a': {
          '.npmignore': 'exclude.js',
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
          }),
        },
      });

      let changedReleasableFiles = await getChangedReleasableFiles({
        changedFiles: [
          'package-a/exclude.js',
          'package-a/include.js',
        ],
        packageCwd: path.join(this.tmpPath, 'package-a'),
        workspacesCwd: this.tmpPath,
      });

      expect(changedReleasableFiles).to.deep.equal([
        'package-a/include.js',
      ].map(path.normalize));
    });

    it('works with gitignore', async function() {
      fixturify.writeSync(this.tmpPath, {
        'package-a': {
          '.gitignore': 'exclude.js',
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
          }),
        },
      });

      let changedReleasableFiles = await getChangedReleasableFiles({
        changedFiles: [
          'package-a/exclude.js',
          'package-a/include.js',
        ],
        packageCwd: path.join(this.tmpPath, 'package-a'),
        workspacesCwd: this.tmpPath,
      });

      expect(changedReleasableFiles).to.deep.equal([
        'package-a/include.js',
      ].map(path.normalize));
    });

    it('works without ignoring', async function() {
      fixturify.writeSync(this.tmpPath, {
        'package-a': {
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
          }),
        },
      });

      let changedReleasableFiles = await getChangedReleasableFiles({
        changedFiles: [
          'package-a/exclude.js',
          'package-a/include.js',
        ],
        packageCwd: path.join(this.tmpPath, 'package-a'),
        workspacesCwd: this.tmpPath,
      });

      expect(changedReleasableFiles).to.deep.equal([
        'package-a/exclude.js',
        'package-a/include.js',
      ].map(path.normalize));
    });

    it('injected and changed files are included', async function() {
      fixturify.writeSync(this.tmpPath, {
        'package-a': {
          '.gitignore': 'exclude.js',
          '.npmignore': 'exclude.js',
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
          }),
        },
      });

      let changedReleasableFiles = await getChangedReleasableFiles({
        changedFiles: [
          'package-a/.gitignore',
          'package-a/.npmignore',
          'package-a/package.json',
        ],
        packageCwd: path.join(this.tmpPath, 'package-a'),
        workspacesCwd: this.tmpPath,
      });

      expect(changedReleasableFiles).to.deep.equal([
        'package-a/.gitignore',
        'package-a/.npmignore',
        'package-a/package.json',
      ].map(path.normalize));
    });

    it('injected but unchanged files are excluded', async function() {
      fixturify.writeSync(this.tmpPath, {
        'package-a': {
          '.gitignore': 'exclude.js',
          '.npmignore': 'exclude.js',
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
          }),
        },
      });

      let changedReleasableFiles = await getChangedReleasableFiles({
        changedFiles: [],
        packageCwd: path.join(this.tmpPath, 'package-a'),
        workspacesCwd: this.tmpPath,
      });

      expect(changedReleasableFiles).to.deep.equal([]);
    });

    it('injected and changed files are respected', async function() {
      fixturify.writeSync(this.tmpPath, {
        'package-a': {
          '.npmignore': 'exclude.js',
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
          }),
        },
      });

      let changedReleasableFiles = await getChangedReleasableFiles({
        changedFiles: [
          'package-a/.npmignore',
          'package-a/exclude.js',
        ],
        packageCwd: path.join(this.tmpPath, 'package-a'),
        workspacesCwd: this.tmpPath,
      });

      expect(changedReleasableFiles).to.deep.equal([
        'package-a/.npmignore',
      ].map(path.normalize));
    });

    it('throws when changed files includes a dir', async function() {
      let promise = getChangedReleasableFiles({
        changedFiles: [
          'package-a/dir1/',
        ],
      });

      await expect(promise).to.eventually.be.rejectedWith(`expected 'package-a/dir1/' to be a file, but it is a directory`);
    });

    describe('shouldExcludeDevChanges', function() {
      let shouldExcludeDevChanges = true;

      beforeEach(async function() {
        this.tmpPath = await gitInit();
      });

      it('excludes with option', async function() {
        fixturify.writeSync(this.tmpPath, {
          'package-a': {
            'package.json': stringifyJson({
              'name': '@scope/package-a',
              'version': '1.0.0',
              'devDependencies': {
                'external-package': '1.0.0',
              },
            }),
          },
        });

        await execa('git', ['add', '.'], { cwd: this.tmpPath });
        await execa('git', ['commit', '-m', 'old file'], { cwd: this.tmpPath });

        await replaceJsonFile(path.join(this.tmpPath, 'package-a/package.json'), json => {
          json.devDependencies['external-package'] = '2.0.0';
        });

        let commit = await getCurrentCommit(this.tmpPath);

        let changedReleasableFiles = await getChangedReleasableFiles({
          changedFiles: [
            'package-a/package.json',
          ],
          packageCwd: path.join(this.tmpPath, 'package-a'),
          workspacesCwd: this.tmpPath,
          shouldExcludeDevChanges,
          tagCommit: commit,
        });

        expect(changedReleasableFiles).to.deep.equal([]);
      });

      it('includes without option', async function() {
        fixturify.writeSync(this.tmpPath, {
          'package-a': {
            'package.json': stringifyJson({
              'name': '@scope/package-a',
              'version': '1.0.0',
              'devDependencies': {
                'external-package': '1.0.0',
              },
            }),
          },
        });

        await execa('git', ['add', '.'], { cwd: this.tmpPath });
        await execa('git', ['commit', '-m', 'old file'], { cwd: this.tmpPath });

        await replaceJsonFile(path.join(this.tmpPath, 'package-a/package.json'), json => {
          json.devDependencies['external-package'] = '2.0.0';
        });

        let changedReleasableFiles = await getChangedReleasableFiles({
          changedFiles: [
            'package-a/package.json',
          ],
          packageCwd: path.join(this.tmpPath, 'package-a'),
          workspacesCwd: this.tmpPath,
        });

        expect(changedReleasableFiles).to.deep.equal([
          'package-a/package.json',
        ].map(path.normalize));
      });
    });
  });

  describe('packageJsonDevChangeRegex', function() {
    it('works', function() {
      expect(packageJsonDevChangeRegex.test('/devDependencies')).to.be.ok;
      expect(packageJsonDevChangeRegex.test('/devDependencies/foo')).to.be.ok;
      expect(packageJsonDevChangeRegex.test('/publishConfig')).to.be.ok;
      expect(packageJsonDevChangeRegex.test('/publishConfig/foo')).to.be.ok;
      expect(packageJsonDevChangeRegex.test('/dependencies')).to.not.be.ok;
      expect(packageJsonDevChangeRegex.test('/dependencies/foo')).to.not.be.ok;
    });
  });
});
