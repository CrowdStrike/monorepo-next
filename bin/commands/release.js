'use strict';

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const release = require('../../src/release');

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
  },
  async handler(argv) {
    try {
      await release({
        ...argv,
        shouldPush: argv['push'],
        shouldPublish: argv['publish'],
        shouldBumpInRangeDependencies: argv['bump-in-range-dependencies'],
        shouldInheritGreaterReleaseType: argv['inherit-greater-release-type'],
        cwd: process.cwd(),
      });

      await exec('yarn');
    } catch (err) {
      console.error(err);
    }
  },
};
