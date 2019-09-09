'use strict';

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const detach = require('../../src/detach');

module.exports = {
  command: 'detach [package]',
  aliases: ['d'],
  describe: 'detach a package from normal linking',
  async handler(argv) {
    try {
      await detach({
        ...argv,
        cwd: process.cwd(),
      });

      await exec('yarn');
    } catch (err) {
      console.error(err);
    }
  },
};
