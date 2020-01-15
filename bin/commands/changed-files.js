'use strict';

const changedFiles = require('../../src/changed-files');

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
    await changedFiles({
      ...argv,
      cwd: process.cwd(),
    });
  },
};
