'use strict';

const commonArgs = require('../common-args');

module.exports = {
  command: 'changed-files [packages..]',
  alias: ['cf'],
  describe: 'list changed files',
  builder: {
    'ext': {
      describe: 'filter by extension',
      type: 'string',
    },
    'only-include-releasable': commonArgs['only-include-releasable'],
  },
  async handler(argv) {
    const changedFiles = require('../../src/changed-files');

    await changedFiles({
      ...argv,
      shouldOnlyIncludeReleasable: argv['only-include-releasable'],
    });
  },
};
