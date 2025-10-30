'use strict';

const semver = require('semver');
const {
  isWorkspaceProtocol,
  isWorkspaceProtocolReplacementVersion,
  extractRange,
} = require('./semver');

function trackNewVersion({
  name,
  oldRange: _oldRange,
  newRange: _newRange,
  newVersion,
}) {
  let oldRange = _oldRange;
  let newRange = _newRange;
  let _isWorkspaceProtocol = isWorkspaceProtocol(_oldRange);

  if (_isWorkspaceProtocol) {
    oldRange = extractRange(_oldRange);
    newRange = extractRange(_newRange);

    if (isWorkspaceProtocolReplacementVersion(oldRange)) {
      return _oldRange;
    }
  }

  let range = new semver.Range(newRange);

  if (range.set.length > 1) {
    console.warn(`Current range has an OR (${name} ${oldRange}) and is too hard to increment, falling back to ^`);
    newRange = `^${newVersion}`;
  } else if (range.set[0].length === 1) {
    if (
      // https://github.com/npm/node-semver/commit/bcab95a966413b978dc1e7bdbcb8f495b63303cd
      range.set[0][0].operator
    ) {
      // This behaviour can probably be removed in the next major.
      newRange = `~${newVersion}`;
    } else if (
      // NOTE: wildcard range is empty string
      // SEE: https://github.com/npm/node-semver/blob/bcab95a966413b978dc1e7bdbcb8f495b63303cd/test/ranges/to-comparators.js#L10-L12
      range.range === ''
    ) {
      // wildcards remain the same
      newRange = oldRange;
    } else {
      newRange = newVersion;
    }
  } else {
    let leftMajor = range.set[0][0].semver.major;
    let rightMajor = range.set[0][1].semver.major;

    if (leftMajor !== rightMajor) {
      newRange = `^${newVersion}`;
    } else {
      newRange = `~${newVersion}`;
    }
  }

  if (_isWorkspaceProtocol) {
    newRange = `workspace:${newRange}`;
  }

  return newRange;
}

module.exports = {
  trackNewVersion,
};
