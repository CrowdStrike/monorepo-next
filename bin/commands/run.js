'use strict';

const run = require('../../src/run');

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
    await run({
      ...argv,
      args: process.argv.slice(3),
    });
  },
};
