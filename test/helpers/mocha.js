'use strict';

require('mocha-helpers')(module);

function setUpSinon() {
  const sinon = require('sinon');

  global.before(function() {
    this.spy = sinon.spy;
    this.stub = sinon.stub;
    this.match = sinon.match;
  });

  global.afterEach(function() {
    sinon.restore();
  });
}

Object.assign(module.exports, {
  setUpSinon,
});
