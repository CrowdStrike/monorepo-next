'use strict';

const { describe, it, setUpTmpDir } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const { getChangedReleasableFiles } = require('../src/releasable');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
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
  });
});
