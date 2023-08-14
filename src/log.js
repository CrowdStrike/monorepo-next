'use strict';

const _debug = require('./debug');

function createLogger(debug = _debug) {
  return async function log(callback, ...args) {
    let _debug = debug.extend(callback.name);

    _debug('begin');

    let before = new Date();

    try {
      return await callback(...args);
    } finally {
      let elapsed = new Date() - before;

      _debug(`end in ${elapsed}ms`);
    }
  };
}

module.exports = {
  createLogger,
};
