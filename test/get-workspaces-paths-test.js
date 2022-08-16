'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const {
  getWorkspacesPaths,
  getWorkspacesPathsSync,
} = require('../src/get-workspaces-paths');
const { createTmpDir } = require('../src/tmp');
const fixturify = require('fixturify');
const stringifyJson = require('../src/json').stringify;
const { stripIndent } = require('common-tags');

describe(function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await createTmpDir();
  });

  describe('yarn', function() {
    describe('workspaces array', function() {
      beforeEach(function() {
        fixturify.writeSync(tmpPath, {
          'packages': {
            'package-a': {
              'package.json': stringifyJson({
                'name': 'package-a',
                'version': '0.0.0',
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
      });

      describe('globs', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });

      describe('spawn', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });
    });

    describe('packages array', function() {
      beforeEach(function() {
        fixturify.writeSync(tmpPath, {
          'packages': {
            'package-a': {
              'package.json': stringifyJson({
                'name': 'package-a',
                'version': '0.0.0',
              }),
            },
          },
          'package.json': stringifyJson({
            'private': true,
            'workspaces': {
              'packages': [
                'packages/*',
              ],
            },
          }),
        });
      });

      describe('globs', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });

      describe('spawn', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });
    });

    describe('missing version', function() {
      beforeEach(function() {
        fixturify.writeSync(tmpPath, {
          'packages': {
            'package-a': {
              'package.json': stringifyJson({
                'name': 'package-a',
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
      });

      describe('globs', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath });

          expect(workspaces).to.be.empty;
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath });

          expect(workspaces).to.be.empty;
        });
      });

      describe('spawn', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.be.empty;
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.be.empty;
        });
      });
    });

    describe('missing name', function() {
      beforeEach(function() {
        fixturify.writeSync(tmpPath, {
          'packages': {
            'package-a': {
              'package.json': stringifyJson({
                'version': '0.0.0',
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
      });

      describe('globs', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath });

          expect(workspaces).to.be.empty;
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath });

          expect(workspaces).to.be.empty;
        });
      });

      describe('spawn', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.be.empty;
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.be.empty;
        });
      });
    });

    describe('dir with files but no package.json', function() {
      beforeEach(function() {
        fixturify.writeSync(tmpPath, {
          'packages': {
            'package-a': {
              'package.json': stringifyJson({
                'name': 'package-a',
                'version': '0.0.0',
              }),
            },
            'README.md': '',
          },
          'package.json': stringifyJson({
            'private': true,
            'workspaces': [
              'packages/*',
            ],
          }),
        });
      });

      describe('globs', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });

      describe('spawn', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });
    });
  });

  describe('pnpm', function() {
    describe('works', function() {
      beforeEach(function() {
        fixturify.writeSync(tmpPath, {
          'packages': {
            'package-a': {
              'package.json': stringifyJson({}),
            },
          },
          'package.json': stringifyJson({}),
          'pnpm-workspace.yaml': stripIndent`
            packages:
            - 'packages/*'
          `,
        });
      });

      describe('globs', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });

      describe('spawn', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });
    });

    describe('empty dir', function() {
      beforeEach(function() {
        fixturify.writeSync(tmpPath, {
          'packages': {
            'package-a': {},
          },
          'package.json': stringifyJson({}),
          'pnpm-workspace.yaml': stripIndent`
            packages:
            - 'packages/*'
          `,
        });
      });

      describe('globs', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath });

          expect(workspaces).to.be.empty;
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath });

          expect(workspaces).to.be.empty;
        });
      });

      describe('spawn', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.be.empty;
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.be.empty;
        });
      });
    });

    describe('dir with files but no package.json', function() {
      beforeEach(function() {
        fixturify.writeSync(tmpPath, {
          'packages': {
            'package-a': {
              'package.json': stringifyJson({}),
            },
            'README.md': '',
          },
          'package.json': stringifyJson({}),
          'pnpm-workspace.yaml': stripIndent`
            packages:
            - 'packages/*'
          `,
        });
      });

      describe('globs', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });

      describe('spawn', function() {
        it(getWorkspacesPaths, async function() {
          let workspaces = await getWorkspacesPaths({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });

        it(getWorkspacesPathsSync, function() {
          let workspaces = getWorkspacesPathsSync({ cwd: tmpPath, shouldSpawn: true });

          expect(workspaces).to.deep.equal([
            'packages/package-a',
          ]);
        });
      });
    });
  });
});
