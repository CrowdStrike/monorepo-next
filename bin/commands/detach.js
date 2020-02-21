'use strict';
const postRun = require('../../src/post-run');

module.exports = {
  command: 'detach [package]',
  aliases: ['d'],
  describe: 'detach a package from normal linking',
  async handler(argv) {
    const detach = require('../../src/detach');

    await detach(argv);

    await postRun();
  },
};
