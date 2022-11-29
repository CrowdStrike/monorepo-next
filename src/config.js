'use strict';

const glob = require('glob');
const path = require('path');

function loadPackageConfig(cwd) {
  const [configFile] = glob.sync('monorepo-next.config.{cjs,js}', { cwd });

  return {
    shouldBumpVersion: true,
    ...(configFile ? require(path.join(cwd, configFile)) : {}),
  };
}

module.exports = {
  loadPackageConfig,
};
