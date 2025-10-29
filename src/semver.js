'use strict';

const semver = require('semver');

/**
 * @param {string} range
 */
function isWorkspaceProtocol(range) {
  return range.startsWith('workspace:');
}

/**
 * @param {string} range
 */
function extractRange(range) {
  return range.replace(/^workspace:/, '');
}

/**
 * @param {string} range
 */
function isWorkspaceProtocolReplacementVersion(range) {
  if (range === '^' || range === '~') {
    return true;
  } else {
    return false;
  }
}

/**
 * @param {string} version
 * @param {string} range
 */
function satisfies(version, range) {
  if (isWorkspaceProtocol(range)) {
    range = extractRange(range);

    if (isWorkspaceProtocolReplacementVersion(range)) {
      return true;
    }
  }

  return semver.satisfies(version, range);
}

/**
 * @param {string} range
 */
function isValidRange(range) {
  if (isWorkspaceProtocol(range)) {
    range = extractRange(range);

    if (isWorkspaceProtocolReplacementVersion(range)) {
      return true;
    }
  }

  return semver.validRange(range);
}

module.exports = {
  isWorkspaceProtocol,
  extractRange,
  isWorkspaceProtocolReplacementVersion,
  satisfies,
  isValidRange,
};
