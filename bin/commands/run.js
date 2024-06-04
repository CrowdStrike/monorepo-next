'use strict';

const commonArgs = require('../common-args');

module.exports = {
  command: 'run',
  describe: 'run script against changed packages',
  builder: {
    'only-include-releasable': commonArgs['only-include-releasable'],
    'exclude-dev-changes': commonArgs['exclude-dev-changes'],
    'exclude-deleted': commonArgs['exclude-deleted'],
    'silent': commonArgs['silent'],
  },
  async handler(argv) {
    const run = require('../../src/run');

    await run({
      ...argv,
      shouldOnlyIncludeReleasable: argv['only-include-releasable'],
      shouldExcludeDevChanges: argv['exclude-dev-changes'],
      shouldExcludeDeleted: argv['exclude-deleted'],
      args: process.argv.slice(3),
    });
  },
};
