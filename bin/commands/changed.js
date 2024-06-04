'use strict';

const commonArgs = require('../common-args');

module.exports = {
  command: 'changed',
  alias: ['c'],
  describe: 'list changed packages',
  builder: {
    'only-include-releasable': commonArgs['only-include-releasable'],
    'exclude-dev-changes': commonArgs['exclude-dev-changes'],
    'exclude-deleted': commonArgs['exclude-deleted'],
  },
  async handler(argv) {
    const changed = require('../../src/changed');

    let _changed = await changed({
      ...argv,
      shouldOnlyIncludeReleasable: argv['only-include-releasable'],
      shouldExcludeDevChanges: argv['exclude-dev-changes'],
      shouldExcludeDeleted: argv['exclude-deleted'],
    });

    for (let name of _changed) {
      console.log(name);
    }
  },
};
