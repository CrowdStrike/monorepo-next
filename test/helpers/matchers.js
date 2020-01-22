'use strict';

const sinon = require('sinon');
const path = require('path');

function matchPath(p) {
  return sinon.match(path.normalize(p));
}

module.exports = {
  matchPath,
};
