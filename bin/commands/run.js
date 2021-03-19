'use strict';

const commonArgs = require('../common-args');

module.exports = {
  command: 'run',
  describe: 'run script against changed packages',
  builder: {
    'only-include-releasable': commonArgs['only-include-releasable'],
    'silent': commonArgs['silent'],
  },
  async handler(argv) {
    const run = require('../../src/run');

    await run({
      ...argv,
      shouldOnlyIncludeReleasable: argv['only-include-releasable'],
      args: process.argv.slice(3),
    });
  },
};
