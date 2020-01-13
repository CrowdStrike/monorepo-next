'use strict';

const release = require('../../src/release');
const postRun = require('../../src/post-run');

const defaults = require('standard-version/defaults');

module.exports = {
  command: 'release',
  describe: 'release all packages as needed',
  builder: {
    'silent': {
      describe: 'Don\'t print logs and errors',
      type: 'boolean',
      default: defaults.silent,
    },
    'push': {
      describe: 'git push + tags when done',
      type: 'boolean',
      default: true,
    },
    'publish': {
      describe: 'npm publish when done',
      type: 'boolean',
      default: true,
    },
    'bump-in-range-dependencies': {
      describe: 'If a dependency is still in range, and nothing changed in my package, still bump my version and the dependency version.',
      type: 'boolean',
      default: true,
    },
    'inherit-greater-release-type': {
      describe: 'If a dependency has a greater release type, bump my package the with the same release type.',
      type: 'boolean',
      default: false,
    },
    'scripts': {
      describe: 'Provide scripts to execute for lifecycle events (prebump, precommit, etc.,)',
      default: defaults.scripts,
    },
    'package-files': {
      default: defaults.packageFiles,
      type: 'array',
    },
    'bump-files': {
      default: defaults.packageFiles,
      type: 'array',
    },
  },
  async handler(argv) {
    let cwd = process.cwd();

    try {
      await release({
        ...argv,
        shouldPush: argv['push'],
        shouldPublish: argv['publish'],
        shouldBumpInRangeDependencies: argv['bump-in-range-dependencies'],
        shouldInheritGreaterReleaseType: argv['inherit-greater-release-type'],
        scripts: argv['scripts'],
        packageFiles: argv['package-files'],
        bumpFiles: argv['bump-files'],
        cwd,
      });

      await postRun({
        cwd,
      });
    } catch (err) {
      console.error(err);
    }
  },
};
