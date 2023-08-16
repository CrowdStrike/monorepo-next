'use strict';

const _debug = require('./debug');

function prepare(callback, debug = _debug) {
  let _debug = debug.extend(callback.name);

  _debug('begin');

  let before = new Date();

  return {
    debug: _debug,
    before,
  };
}

function finish(debug, before) {
  let elapsed = new Date() - before;

  debug(`end in ${elapsed}ms`);
}

function createSyncLogger(debug) {
  return function log(callback, ...args) {
    let {
      debug: _debug,
      before,
    } = prepare(callback, debug);

    try {
      return callback.apply(this, args);
    } finally {
      finish(_debug, before);
    }
  };
}

function createAsyncLogger(debug) {
  return async function log(callback, ...args) {
    let {
      debug: _debug,
      before,
    } = prepare(callback, debug);

    try {
      return await callback.apply(this, args);
    } finally {
      finish(_debug, before);
    }
  };
}

module.exports = {
  createSyncLogger,
  createAsyncLogger,
};
