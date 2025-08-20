'use strict';

const commonArgs = require('../common-args');

module.exports = {
  command: 'update-dist-tag',
  describe: 'update the dist-tag of all packages from a prior release',
  builder: {
    'silent': commonArgs['silent'],
    'dry-run': commonArgs['dry-run'],
    'dist-tag': commonArgs['dist-tag'],
  },
  async handler(argv) {
    const updateDistTag = require('../../src/update-dist-tag');

    await updateDistTag({
      ...argv,
    });
  },
};
