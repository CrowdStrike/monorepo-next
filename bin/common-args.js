'use strict';

const defaults = require('standard-version/defaults');

module.exports = {
  'silent': {
    describe: 'Don\'t print logs and errors',
    type: 'boolean',
    default: defaults.silent,
  },
  'dry-run': {
    describe: 'log to console instead of modifying files',
    type: 'boolean',
    default: false,
  },
};
