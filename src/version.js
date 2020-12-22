'use strict';

const semver = require('semver');

function trackNewVersion({
  name,
  oldRange,
  newRange,
  newVersion,
}) {
  let range = new semver.Range(newRange);

  if (range.set.length > 1) {
    console.warn(`Current range has an OR (${name} ${oldRange}) and is too hard to increment, falling back to ^`);
    newRange = `^${newVersion}`;
  } else if (range.set[0].length === 1) {
    // wildcards remain the same
    // NOTE: wildcard range is empty string
    // SEE: https://github.com/npm/node-semver/blob/bcab95a966413b978dc1e7bdbcb8f495b63303cd/test/ranges/to-comparators.js#L10-L12
    if (range.range === '') {
      newRange = oldRange;
    } else {
      newRange = newVersion;
    }
  } else {
    let leftMajor = range.set[0][0].semver.major;
    let rightMajor = range.set[0][1].semver.major;

    // https://github.com/npm/node-semver/pull/321/commits/100f07aa7137b774180f983ea7968361d26c17b6
    if (leftMajor === undefined) {
      leftMajor = 0;
    }

    if (leftMajor !== rightMajor) {
      newRange = `^${newVersion}`;
    } else {
      newRange = `~${newVersion}`;
    }
  }

  return newRange;
}

module.exports = {
  trackNewVersion,
};
