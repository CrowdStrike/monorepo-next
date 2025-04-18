'use strict';

const { describe, it, setUpTmpDir } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const {
  getChangedReleasableFiles,
  packageJsonDevChangeRegex,
  removeSubDirs,
  relativePathRegex,
} = require('../src/releasable');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const execa = require('execa');
const { gitInit } = require('git-fixtures');
const { getCurrentCommit } = require('./helpers/git');
const { replaceJsonFile } = require('../src/fs');
const path = require('path');
const Set = require('superset');

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
      ]);
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
      ]);
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
      ]);
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
      ]);
    });

    it('works with changeTrackingFiles', async function() {
      fixturify.writeSync(this.tmpPath, {
        'package-a': {
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
            'files': ['dist'],
          }),
          dist: '',
          src: '',
        },
      });

      let changedReleasableFiles = await getChangedReleasableFiles({
        changedFiles: [
          'package-a/dist',
          'package-a/src',
        ],
        packageCwd: path.join(this.tmpPath, 'package-a'),
        workspacesCwd: this.tmpPath,
        nextConfig: {
          changeTrackingFiles: ['src'],
        },
      });

      expect(changedReleasableFiles).to.deep.equal([
        'package-a/dist',
        'package-a/src',
      ]);
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
      ]);
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
      ]);
    });

    it('throws when changed files includes a dir', async function() {
      let promise = getChangedReleasableFiles({
        changedFiles: [
          'package-a/dir1/',
        ],
      });

      await expect(promise).to.eventually.be.rejectedWith(`expected 'package-a/dir1/' to be a file, but it is a directory`);
    });

    it('handles a dir of files converted to a single file where the dir was', async function() {
      fixturify.writeSync(this.tmpPath, {
        'package-a': {
          'package.json': stringifyJson({
            'name': 'package-a',
            'version': '1.0.0',
            'files': ['foo'],
          }),
          'foo': {
            'bar.js': '',
          },
        },
      });

      let changedReleasableFiles = await getChangedReleasableFiles({
        changedFiles: [
          'package-a/foo',
          'package-a/foo/bar.js',
        ],
        packageCwd: path.join(this.tmpPath, 'package-a'),
        workspacesCwd: this.tmpPath,
      });

      expect(changedReleasableFiles).to.deep.equal([
        'package-a/foo/bar.js',
      ]);
    });

    describe('removed package', function() {
      it('works', async function() {
        fixturify.writeSync(this.tmpPath, {
          'package.json': stringifyJson({
            'private': true,
            'workspaces': [
              'packages/*',
            ],
          }),
        });

        let changedReleasableFiles = await getChangedReleasableFiles({
          changedFiles: [
            'packages/package-a/package.json',
          ],
          packageCwd: this.tmpPath,
          workspacesCwd: this.tmpPath,
        });

        expect(changedReleasableFiles).to.deep.equal([
          'packages/package-a/package.json',
        ]);
      });

      it('handles two removed packages that have the same basename', async function() {
        fixturify.writeSync(this.tmpPath, {
          'package.json': stringifyJson({
            'private': true,
            'workspaces': [
              'packages/*/package',
            ],
          }),
        });

        let changedReleasableFiles = await getChangedReleasableFiles({
          changedFiles: [
            'packages/package-a/package/package.json',
            'packages/package-b/package/package.json',
          ],
          packageCwd: this.tmpPath,
          workspacesCwd: this.tmpPath,
        });

        expect(changedReleasableFiles).to.deep.equal([
          'packages/package-a/package/package.json',
          'packages/package-b/package/package.json',
        ]);
      });
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
          fromCommit: commit,
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
        ]);
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

  describe(removeSubDirs, function() {
    it('works when dir is first', function() {
      let files = new Set([
        'foo',
        'foo/bar.js',
      ]);
      let expected = new Set([
        'foo/bar.js',
      ]);

      let actual = removeSubDirs(files);

      expect(actual).to.deep.equal(expected);
    });

    it('works when dir is last', function() {
      let files = new Set([
        'foo/bar.js',
        'foo',
      ]);
      let expected = new Set([
        'foo/bar.js',
      ]);

      let actual = removeSubDirs(files);

      expect(actual).to.deep.equal(expected);
    });

    it('works when no sub dir', function() {
      let files = new Set([
        'foo/bar.js',
        'foo/baz.js',
      ]);
      let expected = new Set([
        'foo/bar.js',
        'foo/baz.js',
      ]);

      let actual = removeSubDirs(files);

      expect(actual).to.deep.equal(expected);
    });

    it('works when different dirs', function() {
      let files = new Set([
        'foo/baz.js',
        'bar/baz.js',
      ]);
      let expected = new Set([
        'foo/baz.js',
        'bar/baz.js',
      ]);

      let actual = removeSubDirs(files);

      expect(actual).to.deep.equal(expected);
    });
  });

  describe('relativePathRegex', function() {
    it('works', function() {
      for (let str of [
        '..',
        '../',
        '..\\',
      ]) {
        expect(str).to.match(relativePathRegex);
      }

      for (let str of [
        '..foo',
      ]) {
        // not.match appears to be broken
        // expect(str).to.not.match(relativePathRegex);

        expect(relativePathRegex.test(str)).to.not.be.ok;
      }
    });
  });
});
