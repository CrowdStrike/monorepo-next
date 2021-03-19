'use strict';

function union(a, b) {
  return new Set([...a, ...b]);
}

function intersection(a, b) {
  let set = new Set();

  for (let elem of b) {
    if (a.has(elem)) {
      set.add(elem);
    }
  }

  return set;
}

function map(set, callback) {
  let newSet = new Set();
  let i = 0;

  for (let value of set) {
    newSet.add(callback(value, i++));
  }

  return newSet;
}

module.exports = {
  union,
  intersection,
  map,
};
