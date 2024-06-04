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
    'exclude-dev-changes': commonArgs['exclude-dev-changes'],
    'exclude-deleted': commonArgs['exclude-deleted'],
  },
  async handler(argv) {
    const changedFiles = require('../../src/changed-files');

    let _changedFiles = await changedFiles({
      ...argv,
      shouldOnlyIncludeReleasable: argv['only-include-releasable'],
      shouldExcludeDevChanges: argv['exclude-dev-changes'],
      shouldExcludeDeleted: argv['exclude-deleted'],
    });

    for (let file of _changedFiles) {
      console.log(file);
    }
  },
};
