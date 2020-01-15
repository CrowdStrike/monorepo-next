'use strict';

const detach = require('../../src/detach');
const postRun = require('../../src/post-run');

module.exports = {
  command: 'detach [package]',
  aliases: ['d'],
  describe: 'detach a package from normal linking',
  async handler(argv) {
    let cwd = process.cwd();

    await detach({
      ...argv,
      cwd,
    });

    await postRun({
      cwd,
    });
  },
};
