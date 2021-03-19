'use strict';

const { promisify } = require('util');
const conventionalRecommendedBump = promisify(require('conventional-recommended-bump'));

async function _getReleaseType(tagPrefix) {
  let { releaseType } = await conventionalRecommendedBump({
    // preset: require('standard-version/defaults').preset,
    preset: require('standard-version/lib/preset-loader')({}),
    path: process.cwd(),
    tagPrefix,
  });

  return releaseType;
}

async function getReleaseType(tagPrefix, cwd) {
  let originalCwd = process.cwd();

  try {
    process.chdir(cwd);

    let releaseType = await _getReleaseType(tagPrefix);

    return releaseType;
  } finally {
    process.chdir(originalCwd);
  }
}

if (require.main === module) {
  (async () => {
    let tagPrefix = process.argv[2];

    let releaseType = await _getReleaseType(tagPrefix);

    process.send(releaseType);
  })();
} else {
  module.exports = getReleaseType;
}

