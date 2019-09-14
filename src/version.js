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
    newRange = newVersion;
  } else {
    let left = range.set[0][0].semver;
    let right = range.set[0][1].semver;
    if (left.major !== right.major) {
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
