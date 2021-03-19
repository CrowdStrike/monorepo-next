'use strict';

const defaults = require('standard-version/defaults');

module.exports = {
  'only-include-releasable': {
    describe: 'If a file was changed that is not published, don\'t count it towards a package change.',
    type: 'boolean',
    default: false,
  },
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
