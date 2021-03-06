'use strict';

const commonArgs = require('../common-args');

module.exports = {
  command: 'defrag',
  describe: 'synchronize all dependency version discrepancies',
  builder: {
    'include': {
      describe: 'only synchronize a subset of dependencies',
      type: 'array',
      default: [],
    },
    'exclude': {
      describe: 'ignore a subset of dependencies',
      type: 'array',
      default: [],
    },
    'out-of-range': {
      describe: 'override ranges that are out of range',
      type: 'string',
      choices: ['major', 'minor', 'patch'],
    },
    'dry-run': commonArgs['dry-run'],
  },
  async handler(argv) {
    const defrag = require('../../src/defrag');

    await defrag({
      ...argv,
    });
  },
};
