'use strict';

function union(a, b) {
  return new Set([...a, ...b]);
}

module.exports = {
  union,
};
