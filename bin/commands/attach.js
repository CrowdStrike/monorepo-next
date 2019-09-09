'use strict';

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const attach = require('../../src/attach');

module.exports = {
  command: 'attach [package]',
  aliases: ['a'],
  describe: 'attach a package to a detached package to resume normal linking',
  async handler(argv) {
    try {
      await attach({
        ...argv,
        cwd: process.cwd(),
      });

      await exec('yarn');
    } catch (err) {
      console.error(err);
    }
  },
};
