'use strict';

module.exports = {
  command: 'changed-files [packages..]',
  alias: ['cf'],
  describe: 'list changed files',
  builder: {
    'ext': {
      describe: 'filter by extension',
      type: 'string',
    },
  },
  async handler(argv) {
    const changedFiles = require('../../src/changed-files');

    await changedFiles(argv);
  },
};
