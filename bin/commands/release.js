'use strict';

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const release = require('../../src/release');

const defaults = require('standard-version/defaults');

module.exports = {
  command: 'release',
  describe: 'release all packages as needed',
  builder: {
    'silent': {
      describe: 'Don\'t print logs and errors',
      type: 'boolean',
      default: defaults.silent,
    },
    'push': {
      describe: 'git push + tags when done',
      type: 'boolean',
      default: true,
    },
    'publish': {
      describe: 'npm publish when done',
      type: 'boolean',
      default: true,
    },
  },
  async handler(argv) {
    try {
      await release({
        ...argv,
        shouldPush: argv.push,
        shouldPublish: argv.publish,
        cwd: process.cwd(),
      });

      await exec('yarn');
    } catch (err) {
      console.error(err);
    }
  },
};
