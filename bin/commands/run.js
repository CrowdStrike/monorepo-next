'use strict';

const commonArgs = require('../common-args');

module.exports = {
  command: 'run',
  describe: 'run script against changed packages',
  builder: {
    'only-include-releasable': commonArgs['only-include-releasable'],
    'exclude-dev-changes': commonArgs['exclude-dev-changes'],
    'silent': commonArgs['silent'],
  },
  async handler(argv) {
    const run = require('../../src/run');

    await run({
      ...argv,
      shouldOnlyIncludeReleasable: argv['only-include-releasable'],
      shouldExcludeDevChanges: argv['exclude-dev-changes'],
      args: process.argv.slice(3),
    });
  },
};
