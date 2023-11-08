'use strict';

const { promisify } = require('util');
const glob = promisify(require('glob'));
const path = require('path');

async function loadPackageConfig(cwd) {
  const [configFile] = await glob('monorepo-next.config.{cjs,js}', { cwd });

  return {
    shouldBumpVersion: true,
    ...(configFile ? require(path.join(cwd, configFile)) : {}),
  };
}

module.exports = {
  loadPackageConfig,
};
