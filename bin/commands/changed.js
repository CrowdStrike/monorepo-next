'use strict';

module.exports = {
  command: 'changed',
  alias: ['c'],
  describe: 'list changed packages',
  async handler() {
    const changed = require('../../src/changed');

    await changed();
  },
};
