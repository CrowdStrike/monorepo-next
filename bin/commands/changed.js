'use strict';

const commonArgs = require('../common-args');

module.exports = {
  command: 'changed',
  alias: ['c'],
  describe: 'list changed packages',
  builder: {
    'only-include-releasable': commonArgs['only-include-releasable'],
  },
  async handler(argv) {
    const changed = require('../../src/changed');

    await changed({
      ...argv,
      shouldOnlyIncludeReleasable: argv['only-include-releasable'],
    });
  },
};
