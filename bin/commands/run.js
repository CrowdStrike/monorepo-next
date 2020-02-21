'use strict';

const defaults = require('standard-version/defaults');

module.exports = {
  command: 'run',
  describe: 'run script against changed packages',
  builder: {
    'silent': {
      describe: 'Don\'t print logs and errors',
      type: 'boolean',
      default: defaults.silent,
    },
  },
  async handler(argv) {
    const run = require('../../src/run');

    await run({
      ...argv,
      args: process.argv.slice(3),
    });
  },
};
