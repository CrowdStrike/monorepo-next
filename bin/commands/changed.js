'use strict';

const changed = require('../../src/changed');

module.exports = {
  command: 'changed',
  alias: ['c'],
  describe: 'list changed packages',
  async handler() {
    await changed({
      cwd: process.cwd(),
    });
  },
};
