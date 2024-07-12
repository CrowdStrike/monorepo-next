'use strict';

const defaults = require('commit-and-tag-version/defaults');

module.exports = {
  'only-include-releasable': {
    describe: 'If a file was changed that is not published, don\'t count it towards a package change.',
    type: 'boolean',
    default: false,
  },
  'exclude-dev-changes': {
    describe: 'If a change doesn\'t affect consumers, like a monorepo dev dep change or manually bumping an external dev dep, don\'t count it towards a package change.',
    type: 'boolean',
    default: false,
  },
  'exclude-deleted': {
    describe: 'Excluded deleted files from the changeset.',
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
