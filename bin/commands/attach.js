'use strict';

const postRun = require('../../src/post-run');

module.exports = {
  command: 'attach [package]',
  aliases: ['a'],
  describe: 'attach a package to a detached package to resume normal linking',
  async handler(argv) {
    const attach = require('../../src/attach');

    await attach(argv);

    await postRun();
  },
};
