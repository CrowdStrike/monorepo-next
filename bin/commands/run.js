'use strict';

const commonArgs = require('../common-args');

module.exports = {
  command: 'run',
  describe: 'run script against changed packages',
  builder: {
    'silent': commonArgs['silent'],
  },
  async handler(argv) {
    const run = require('../../src/run');

    await run({
      ...argv,
      args: process.argv.slice(3),
    });
  },
};
