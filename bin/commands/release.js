'use strict';

const commonArgs = require('../common-args');
const postRun = require('../../src/post-run');

const defaults = require('standard-version/defaults');

module.exports = {
  command: 'release',
  describe: 'release all packages as needed',
  builder: {
    'silent': commonArgs['silent'],
    'dry-run': commonArgs['dry-run'],
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
    'exclude-dev-changes': commonArgs['exclude-dev-changes'],
    'clean-up-after-failed-push': {
      describe: 'If there\'s already a new commit on the remote, clean up the commit and tags that won\'t be used',
      type: 'boolean',
      default: false,
    },
    'scripts': {
      describe: 'Provide scripts to execute for lifecycle events (prebump, precommit, etc.,)',
      default: defaults.scripts,
    },
    'package-files': {
      type: 'array',
      default: defaults.packageFiles,
    },
    'bump-files': {
      type: 'array',
      default: defaults.bumpFiles,
    },
    'default-branch': {
      type: 'string',
      default: 'master',
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
