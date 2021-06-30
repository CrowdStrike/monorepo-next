'use strict';

const _debug = require('debug');
const { name } = require('../package');

function debug(scope) {
  return _debug(`${name}:${scope}`);
}

module.exports = debug;
