'use strict';

const commonArgs = require('../common-args');
const postRun = require('../../src/post-run');

const defaults = require('standard-version/defaults');

module.exports = {
  command: 'release',
  describe: 'release all packages as needed',
  builder: {
    'silent': commonArgs['silent'],
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
    'exclude-dev-changes': {
      describe: 'If a change doesn\'t affect consumers, like a monorepo dev dep change, don\'t count it towards a package change.',
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
      default: defaults.bumpFiles,
      type: 'array',
    },
  },
  async handler(argv) {
    const release = require('../../src/release');

    await release({
      ...argv,
      shouldPush: argv['push'],
      shouldPublish: argv['publish'],
      shouldBumpInRangeDependencies: argv['bump-in-range-dependencies'],
      shouldInheritGreaterReleaseType: argv['inherit-greater-release-type'],
      shouldExcludeDevChanges: argv['exclude-dev-changes'],
    });

    await postRun();
  },
};
