'use strict';

const path = require('path');

function loadPackageConfig(cwd) {
  let nextConfig;

  try {
    nextConfig = require(path.join(cwd, 'monorepo-next.config.js'));
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err;
    }

    nextConfig = {};
  }

  return {
    shouldBumpVersion: true,
    ...nextConfig,
  };
}

module.exports = {
  loadPackageConfig,
};
